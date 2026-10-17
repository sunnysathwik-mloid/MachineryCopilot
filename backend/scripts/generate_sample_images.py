from pathlib import Path
import io

PUBLIC_DIR = Path(__file__).resolve().parent.parent / "frontend" / "public"
PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

# Generate simple valid JPEG files for sample equipment
def create_sample_image(filename: str, title: str, status_color: tuple):
    try:
        from PIL import Image, ImageDraw, ImageFont
        img = Image.new("RGB", (640, 480), color=(15, 23, 42))
        draw = ImageDraw.Draw(img)
        
        # Grid
        for x in range(0, 640, 40):
            draw.line([(x, 0), (x, 480)], fill=(30, 41, 59), width=1)
        for y in range(0, 480, 40):
            draw.line([(0, y), (640, y)], fill=(30, 41, 59), width=1)
            
        # Machine housing
        draw.rounded_rectangle([(120, 100), (520, 380)], radius=20, fill=(30, 41, 59), outline=(245, 158, 11), width=4)
        draw.ellipse([(260, 180), (380, 300)], fill=(51, 65, 85), outline=(148, 163, 184), width=5)
        
        # Warning badge
        draw.ellipse([(440, 140), (490, 190)], fill=status_color)
        
        # Text label
        draw.text((140, 50), title.upper(), fill=(255, 255, 255))
        draw.text((140, 410), "FIELD INSPECTION UNIT: 04", fill=(245, 158, 11))
        
        dest = PUBLIC_DIR / filename
        img.save(str(dest), "JPEG")
        print(f"Created {filename} via PIL")
    except Exception:
        # Fallback minimal JPEG generator
        dest = PUBLIC_DIR / filename
        with open(dest, "wb") as f:
            # Minimal 1x1 JPEG bytes
            f.write(bytes.fromhex("ffd8ffe000104a46494600010101004800480000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffc0000b080001000101011100ffda0008010100003f00bf00ffd9"))
        print(f"Created minimal stub {filename}")

def main():
    create_sample_image("sample_pump.jpg", "Centrifugal Pump - Seal Leak", (239, 68, 68))
    create_sample_image("sample_motor.jpg", "3-Phase Motor - Overheating", (245, 158, 11))
    create_sample_image("sample_compressor.jpg", "Air Compressor - Relief Vent", (168, 85, 247))

if __name__ == "__main__":
    main()
