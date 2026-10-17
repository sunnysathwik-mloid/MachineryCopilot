"""
judge_service.py — LLM-as-Judge (Stage 2)

Takes the Generator's diagnosis output and the pump manual,
then asks a separate Gemini call to score the response on 4 criteria:
  1. Manual Grounding (0-10)     — Are steps verbatim from the manual?
  2. Safety Protocol Compliance (0-10) — Is LOTO mentioned when required?
  3. Step Completeness (0-10)    — Are all critical steps present?
  4. Vernacular Accuracy (0-10)  — Is the vernacular script coherent and correct?

Returns a JudgeResult dict. Works fully offline with a heuristic scorer.
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
PUMP_MANUAL_FILE = BASE_DIR / "data" / "pump_manual.json"

_PUMP_MANUAL: Dict[str, Any] = {}
try:
    with open(PUMP_MANUAL_FILE, "r", encoding="utf-8") as f:
        _PUMP_MANUAL = json.load(f)
except Exception as e:
    print(f"[JudgeService] Warning: could not load manual: {e}")


class LLMJudgeService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.client = None
        self._init_gemini()

    def _init_gemini(self):
        if self.api_key and self.api_key != "your_gemini_api_key_here":
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                # Judge uses text-only flash — no multimodal needed
                self.client = genai.GenerativeModel("gemini-1.5-flash")
                print("[JudgeService] LLM Judge (Gemini 1.5 Flash) initialized.")
            except Exception as e:
                print(f"[JudgeService] Gemini init warning: {e}")
        else:
            print("[JudgeService] No GEMINI_API_KEY — using heuristic offline judge.")

    async def judge_diagnosis(
        self,
        diagnosis: Dict[str, Any],
        language: str
    ) -> Dict[str, Any]:
        """
        Stage 2 — Judge:
        Evaluates the Generator's output against the pump manual.
        """
        manual_text = json.dumps(_PUMP_MANUAL, ensure_ascii=False, indent=2)
        diagnosis_text = json.dumps(diagnosis, ensure_ascii=False, indent=2)

        if self.client:
            try:
                judge_prompt = f"""You are a Senior Pump Safety Auditor and an expert in ISO 5199 / API 610 standards.

Your task: Evaluate the AI diagnostic response below against the official pump manual.
Score each criterion from 0 to 10, where 10 = perfect, 7 = acceptable, below 7 = needs correction.

=== OFFICIAL PUMP MANUAL (Source of Truth) ===
{manual_text}
=== END OF MANUAL ===

=== AI DIAGNOSTIC RESPONSE TO EVALUATE ===
{diagnosis_text}
=== END OF RESPONSE ===

Evaluate on these 4 criteria:

1. **manual_grounding** (0-10): Are the diagnostic steps traceable to specific sections of the manual above?
   Deduct points for any invented steps not in the manual.

2. **safety_compliance** (0-10): When safety_lockout_required is true, does the response include LOTO steps?
   Must mention: de-energisation, padlock, pressure venting. Deduct 3 pts per missing LOTO step.

3. **step_completeness** (0-10): Are all critical steps for the identified fault present (compare to manual)?
   Score based on fraction of manual steps present in the AI response.

4. **vernacular_accuracy** (0-10): Is the vernacular_audio_script coherent, technically correct, and in the right language ({language})?
   Score 10 if correct dialect, 5 if wrong dialect, 0 if blank.

Then compute: overall_score = average of all 4 criteria (to 1 decimal place).
verdict: "PASS" if overall_score >= 7.0, else "NEEDS_REVIEW".

Return ONLY a valid JSON object (no markdown, no backticks):
{{
  "criteria_scores": {{
    "manual_grounding": <0-10>,
    "safety_compliance": <0-10>,
    "step_completeness": <0-10>,
    "vernacular_accuracy": <0-10>
  }},
  "overall_score": <float>,
  "verdict": "PASS" | "NEEDS_REVIEW",
  "judge_reasoning": "<2-3 sentence explanation of the scores>",
  "corrective_notes": "<Specific improvements needed, or empty string if PASS>"
}}"""

                # Retry loop for Gemini judge call (handles transient rate limits & JSON formatting errors)
                max_api_retries = 3
                last_err = None
                for attempt in range(1, max_api_retries + 1):
                    try:
                        response = self.client.generate_content(judge_prompt)
                        text = response.text.strip()
                        if text.startswith("```json"):
                            text = text[7:]
                        if text.startswith("```"):
                            text = text[3:]
                        if text.endswith("```"):
                            text = text[:-3]
                        result = json.loads(text.strip())
                        result["judge_attempt"] = attempt
                        result["judge_source"] = "gemini_1.5_flash"
                        return result
                    except Exception as err:
                        last_err = err
                        print(f"[JudgeService] Attempt {attempt}/{max_api_retries} failed: {err}")
                        if attempt < max_api_retries:
                            import asyncio
                            await asyncio.sleep(0.8 * attempt)

                print(f"[JudgeService] All {max_api_retries} Gemini judge attempts failed: {last_err}. Falling back to heuristic.")

            except Exception as e:
                print(f"[JudgeService] Gemini judge fell back to heuristic: {e}")

        # Offline heuristic judge
        res = self._heuristic_judge(diagnosis, language)
        res["judge_attempt"] = 1
        res["judge_source"] = "heuristic_offline"
        return res

    def _heuristic_judge(self, diagnosis: Dict[str, Any], language: str) -> Dict[str, Any]:
        """
        Deterministic offline judge that checks key criteria against the manual.
        """
        manual_steps_map = _PUMP_MANUAL.get("diagnostic_steps", {})
        fault_id = diagnosis.get("fault_id", "F01")
        step_key_map = {"F01": "F01_seal_leakage", "F02": "F02_cavitation", "F03": "F03_bearing_failure", "F04": "F04_impeller_wear"}
        step_key = step_key_map.get(fault_id, "F01_seal_leakage")
        reference_steps = manual_steps_map.get(step_key, [])
        ai_steps = diagnosis.get("diagnostic_steps", [])
        vernacular_script = diagnosis.get("vernacular_audio_script", "")

        # 1. Manual Grounding — check how many reference keywords appear in AI steps
        ai_steps_text = " ".join(ai_steps).lower()
        keywords_found = sum(
            1 for step in reference_steps
            if any(kw.lower() in ai_steps_text for kw in step.split()[:4])
        )
        manual_grounding = round(min(10, (keywords_found / max(len(reference_steps), 1)) * 10))

        # 2. Safety Compliance — check for LOTO keywords when required
        safety_required = diagnosis.get("safety_lockout_required", False)
        if safety_required:
            loto_keywords = ["loto", "lockout", "lock out", "isolat", "de-energi", "padlock", "vent"]
            loto_found = sum(1 for kw in loto_keywords if kw in ai_steps_text)
            safety_compliance = min(10, round(loto_found * 2.5))
        else:
            safety_compliance = 9  # No LOTO required, full marks

        # 3. Step Completeness — fraction of reference steps present
        completeness_ratio = len(ai_steps) / max(len(reference_steps), 1)
        step_completeness = round(min(10, completeness_ratio * 10))

        # 4. Vernacular Accuracy — non-empty and language detected
        lang_check_map = {
            "ta": ["படி", "பம்", "சீல்", "வால்வ"],
            "hi": ["चरण", "पंप", "सील", "बंद"],
            "te": ["దశ", "పంపు"],
            "kn": ["ಹಂತ", "ಪಂಪ್"],
            "mr": ["पायरी", "पंप"],
            "en": ["step", "pump", "seal", "valve"]
        }
        expected_kws = lang_check_map.get(language, lang_check_map["en"])
        script_lower = vernacular_script.lower()
        kw_matches = sum(1 for kw in expected_kws if kw in script_lower)
        vernacular_accuracy = min(10, 6 + kw_matches) if vernacular_script else 0

        criteria = {
            "manual_grounding": manual_grounding,
            "safety_compliance": safety_compliance,
            "step_completeness": step_completeness,
            "vernacular_accuracy": vernacular_accuracy,
        }
        overall = round(sum(criteria.values()) / 4, 1)
        verdict = "PASS" if overall >= 7.0 else "NEEDS_REVIEW"

        corrective = ""
        if safety_compliance < 7:
            corrective += "Safety: LOTO steps (de-energise, pressure vent) must be explicitly stated. "
        if manual_grounding < 7:
            corrective += "Grounding: Steps deviate from ISO 5199 manual. Use only manual-specified procedures. "
        if step_completeness < 7:
            corrective += f"Completeness: Only {len(ai_steps)}/{len(reference_steps)} required steps present. "

        reasoning = (
            f"Heuristic evaluation against pump manual. "
            f"Manual grounding: {manual_grounding}/10, Safety: {safety_compliance}/10, "
            f"Completeness: {step_completeness}/10, Vernacular: {vernacular_accuracy}/10. "
            f"{'Response meets quality threshold.' if verdict == 'PASS' else 'Response needs review.'}"
        )

        return {
            "criteria_scores": criteria,
            "overall_score": overall,
            "verdict": verdict,
            "judge_reasoning": reasoning,
            "corrective_notes": corrective.strip()
        }


judge_service = LLMJudgeService()
