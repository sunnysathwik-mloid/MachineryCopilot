from pathlib import Path
from gtts import gTTS

AUDIO_DIR = Path(__file__).resolve().parent.parent / "audio_cache"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

DEMO_SCRIPTS = {
    "tamil": {
        "text": "படி 1: பம்பை உடனடியாக அணைத்து லாக்-அவுட் செய்யவும். படி 2: மெக்கானிக்கல் சீல் மற்றும் கேசிங் பகுதியில் திரவ கசிவு உள்ளதா என சரிபார்க்கவும். படி 3: உறிஞ்சும் வால்வு அடைப்பை நீக்கி புதிய சீல் பொருத்தவும்.",
        "lang": "ta"
    },
    "hindi": {
        "text": "चरण 1: पंप की बिजली तुरंत बंद करें और एलओटीओ लगाएं। चरण 2: मैकेनिकल सील से तरल रिसाव की जांच करें। चरण 3: सक्शन वाल्व का कचरा साफ करें और जरूरत पड़ने पर सील बदलें।",
        "lang": "hi"
    },
    "telugu": {
        "text": "దశ 1: పంపు విద్యుత్ సరఫరాను వెంటనే ఆపివేయండి. దశ 2: మెకానికల్ సీల్ వద్ద ద్రవ లీకేజీని తనిఖీ చేయండి. దశ 3: చూషణ వాల్వ్ అడ్డంకిని తొలగించి సీల్ మార్చండి.",
        "lang": "te"
    },
    "kannada": {
        "text": "ಹಂತ 1: ಪಂಪ್ ವಿದ್ಯುತ್ ಸರಬರಾಜನ್ನು ತಕ್ಷಣ ಆಫ್ ಮಾಡಿ. ಹಂತ 2: ಮೆಕ್ಯಾನಿಕಲ್ ಸೀಲ್ ಸೋರಿಕೆಯನ್ನು ಪರಿಶೀಲಿಸಿ. ಹಂತ 3: ಸಕ್ಷನ್ ವಾಲ್ವ್ ಸ್ವಚ್ಛಗೊಳಿಸಿ ಅಗತ್ಯವಿದ್ದರೆ ಸೀಲ್ ಬದಲಾಯಿಸಿ.",
        "lang": "kn"
    },
    "marathi": {
        "text": "पायरी 1: पंपाचा वीज पुरवठा त्वरित बंद करा. पायरी 2: मेकॅनिकल सीलमधून द्रव गळती होत आहे का ते तपासा. पायरी 3: सक्शन व्हॉल्व्ह स्वच्छ करा आणि आवश्यक असल्यास सील बदला.",
        "lang": "mr"
    },
    "english": {
        "text": "Step 1: Shut down pump power and apply Lockout-Tagout. Step 2: Inspect mechanical seal for fluid leakage. Step 3: Clear suction strainer blockage and replace damaged seal.",
        "lang": "en"
    }
}

def main():
    print("Generating demo MP3 files...")
    for dialect, item in DEMO_SCRIPTS.items():
        filename = f"demo_step_1_{dialect}.mp3"
        dest_path = AUDIO_DIR / filename
        print(f"Creating {filename} ({item['lang']})...")
        try:
            tts = gTTS(text=item["text"], lang=item["lang"], slow=False)
            tts.save(str(dest_path))
            print(f"  ✓ Saved {dest_path.name} ({dest_path.stat().st_size} bytes)")
        except Exception as e:
            print(f"  ! gTTS generation note for {dialect}: {e}")
            # Ensure valid placeholder exists
            if not dest_path.exists():
                with open(dest_path, "wb") as f:
                    f.write(b'\xff\xfb\x90d\x00\x00\x00\x00' * 64)
                print(f"  ✓ Created stub {dest_path.name}")

if __name__ == "__main__":
    main()
