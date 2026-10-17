import json
from pathlib import Path
from typing import Optional, Dict, Any, List

BASE_DIR = Path(__file__).resolve().parent.parent
MANUALS_FILE = BASE_DIR / "data" / "equipment_manuals.json"
CHROMA_DIR = BASE_DIR / "chroma_db"

class MachineryRAGService:
    def __init__(self):
        self.manuals: List[Dict[str, Any]] = []
        self.chroma_collection = None
        self._load_local_manuals()
        self._init_chromadb()

    def _load_local_manuals(self):
        try:
            if MANUALS_FILE.exists():
                with open(MANUALS_FILE, "r", encoding="utf-8") as f:
                    self.manuals = json.load(f)
        except Exception as e:
            print(f"[RAG] Error loading manuals JSON: {e}")
            self.manuals = []

    def _init_chromadb(self):
        try:
            import chromadb
            client = chromadb.PersistentClient(path=str(CHROMA_DIR))
            self.chroma_collection = client.get_or_create_collection(name="equipment_manuals")
            
            # Populate if empty
            if self.chroma_collection.count() == 0 and self.manuals:
                documents = []
                metadatas = []
                ids = []
                for idx, m in enumerate(self.manuals):
                    doc_content = (
                        f"Equipment: {m.get('equipment')}\n"
                        f"Symptoms: {', '.join(m.get('symptoms', []))}\n"
                        f"Causes: {', '.join(m.get('possible_causes', []))}\n"
                        f"Steps: {' '.join(m.get('diagnostic_steps', []))}"
                    )
                    documents.append(doc_content)
                    metadatas.append({"id": m.get("id"), "equipment": m.get("equipment")})
                    ids.append(m.get("id", f"manual_{idx}"))
                self.chroma_collection.add(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
                print(f"[RAG] Indexed {len(documents)} equipment manuals into ChromaDB.")
        except Exception as e:
            print(f"[RAG] ChromaDB initialization note: {e}. Falling back to fuzzy keyword manual lookup.")
            self.chroma_collection = None

    def query_manual(self, query: str) -> Dict[str, Any]:
        """
        Retrieves the most relevant equipment manual matching the query symptoms or equipment type.
        """
        query_lower = query.lower()
        
        # 1. Try ChromaDB vector query if initialized
        if self.chroma_collection:
            try:
                results = self.chroma_collection.query(
                    query_texts=[query],
                    n_results=1
                )
                if results and results.get("ids") and len(results["ids"][0]) > 0:
                    matched_id = results["ids"][0][0]
                    for manual in self.manuals:
                        if manual.get("id") == matched_id:
                            return manual
            except Exception as e:
                print(f"[RAG] ChromaDB query fallback due to: {e}")

        # 2. Heuristic fallback based on keywords
        if "motor" in query_lower or "heat" in query_lower or "vibrat" in query_lower or "electric" in query_lower:
            return next((m for m in self.manuals if "Motor" in m.get("equipment", "")), self.manuals[0] if self.manuals else {})
        elif "compressor" in query_lower or "pressure" in query_lower or "air" in query_lower:
            return next((m for m in self.manuals if "Compressor" in m.get("equipment", "")), self.manuals[0] if self.manuals else {})
        elif "pump" in query_lower or "leak" in query_lower or "water" in query_lower or "seal" in query_lower:
            return next((m for m in self.manuals if "Pump" in m.get("equipment", "")), self.manuals[0] if self.manuals else {})
        
        # Default to first manual (Pump)
        return self.manuals[0] if self.manuals else {
            "equipment": "Industrial Centrifugal Pump",
            "symptoms": ["seal leakage", "pressure drop"],
            "safety_precautions": ["Lock out electrical circuit."],
            "diagnostic_steps": ["Step 1: Check mechanical seal."],
            "vernacular_instructions": {
                "ta": "படி 1: பம்பை உடனடியாக அணைக்கவும். சீல் கசிவை சரிபார்க்கவும்.",
                "hi": "चरण 1: पंप बंद करें और सील रिसाव की जांच करें।",
                "en": "Step 1: De-energize pump and check mechanical seal."
            }
        }

rag_service = MachineryRAGService()
