import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT_DIR = r"C:\Users\sunit\Desktop\pushups-app\playstore-assets"
SOURCE_ICON = r"C:\Users\sunit\Desktop\pushups-app\mobile\src\assets\app_icon.png"
ARTIFACTS_DIR = r"C:\Users\sunit\.gemini\antigravity\brain\85617bd4-b1f5-46b5-8d0e-e3a248697b4b"

os.makedirs(OUTPUT_DIR, exist_ok=True)

FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_REGULAR = r"C:\Windows\Fonts\segoeui.ttf"
FONT_SEMIBOLD = r"C:\Windows\Fonts\segoeuisl.ttf"

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

# ==========================================
# 1. APP ICON (512 x 512 px)
# ==========================================
def generate_app_icon():
    print("[1/3] Generating 512x512 App Icon...")
    icon = Image.open(SOURCE_ICON).convert("RGBA")
    icon = icon.resize((512, 512), Image.Resampling.LANCZOS)
    dest = os.path.join(OUTPUT_DIR, "app_icon_512x512.png")
    icon.save(dest, "PNG", optimize=True)
    print(f"  -> Saved {dest} ({os.path.getsize(dest)} bytes)")

# ==========================================
# 2. FEATURE GRAPHIC (1024 x 500 px)
# ==========================================
def generate_feature_graphic():
    print("[2/3] Generating 1024x500 Feature Graphic...")
    w, h = 1024, 500
    img = Image.new("RGB", (w, h), (10, 15, 29)) # #0A0F1D deep dark navy
    draw = ImageDraw.Draw(img)

    # Ambient glow gradients
    # Draw cyan / emerald ambient glow on top right and bottom left
    for r in range(350, 0, -10):
        alpha = int(25 * (1 - r / 350))
        draw.ellipse([800 - r, 120 - r, 800 + r, 120 + r], fill=(16, 185, 129, alpha))
        draw.ellipse([150 - r, 420 - r, 150 + r, 420 + r], fill=(6, 182, 212, alpha))

    # Subtle tech grid pattern
    grid_color = (25, 36, 60)
    for x in range(0, w, 40):
        draw.line([(x, 0), (x, h)], fill=grid_color, width=1)
    for y in range(0, h, 40):
        draw.line([(0, y), (w, y)], fill=grid_color, width=1)

    # App Icon badge
    icon = Image.open(SOURCE_ICON).convert("RGBA")
    icon_size = 210
    icon = icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
    
    # Outer glow / rounded card for icon
    icon_x = 70
    icon_y = (h - icon_size) // 2
    
    # Draw rounded container with border
    draw.rounded_rectangle([icon_x - 12, icon_y - 12, icon_x + icon_size + 12, icon_y + icon_size + 12],
                           radius=42, fill=(15, 23, 42), outline=(16, 185, 129), width=3)
    img.paste(icon, (icon_x, icon_y), mask=icon.split()[3])

    # Text Content
    text_x = 330
    
    # Category Pill
    draw.rounded_rectangle([text_x, 82, text_x + 230, 114], radius=16, fill=(16, 185, 129, 40), outline=(16, 185, 129), width=2)
    font_pill = get_font(FONT_BOLD, 14)
    draw.text((text_x + 18, 90), "CYBER-FITNESS MATRIX", font=font_pill, fill=(52, 211, 153))

    # Main Title
    font_title = get_font(FONT_BOLD, 52)
    draw.text((text_x, 125), "PUSHUP TITAN", font=font_title, fill=(255, 255, 255))

    # Subtitle
    font_sub = get_font(FONT_SEMIBOLD, 22)
    draw.text((text_x, 195), "Level Up Your Pushups & Fuel Your Gains", font=font_sub, fill=(148, 163, 184))

    # Feature badges
    features = [
        ("⚡", "Hands-Free Proximity Counter", (56, 189, 248)),
        ("🟩", "GitHub-Style Activity Heatmap", (74, 222, 128)),
        ("🥚", "Precision Egg Fuel & Nutrition", (251, 191, 36)),
    ]

    badge_y = 250
    font_feat = get_font(FONT_BOLD, 17)
    for icon_txt, label, color in features:
        # Badge card
        draw.rounded_rectangle([text_x, badge_y, text_x + 580, badge_y + 42], radius=12, fill=(18, 28, 51), outline=(30, 41, 59), width=1)
        draw.text((text_x + 14, badge_y + 9), icon_txt, font=font_feat, fill=color)
        draw.text((text_x + 46, badge_y + 9), label, font=font_feat, fill=(241, 245, 249))
        badge_y += 50

    # Bottom trust footer
    font_footer = get_font(FONT_REGULAR, 14)
    draw.text((text_x, 415), "Offline First • Real-time Cloud Sync • Privacy Guaranteed", font=font_footer, fill=(100, 116, 139))

    dest = os.path.join(OUTPUT_DIR, "feature_graphic_1024x500.png")
    img.save(dest, "PNG", optimize=True)
    print(f"  -> Saved {dest} ({os.path.getsize(dest)} bytes)")

# ==========================================
# 3. SCREENSHOTS (1080 x 2400 px)
# ==========================================
def create_framed_screenshot(output_name, tag_text, headline_text, subtitle_text, screen_file, accent_color=(16, 185, 129)):
    w, h = 1080, 2400
    img = Image.new("RGB", (w, h), (7, 11, 20)) # Dark modern slate
    draw = ImageDraw.Draw(img)

    # Ambient gradient glow
    for r in range(450, 0, -15):
        alpha = int(22 * (1 - r / 450))
        draw.ellipse([w // 2 - r, 300 - r, w // 2 + r, 300 + r], fill=(accent_color[0], accent_color[1], accent_color[2], alpha))

    # Header Tag Pill
    tag_font = get_font(FONT_BOLD, 28)
    bbox = draw.textbbox((0, 0), tag_text, font=tag_font)
    tag_w = bbox[2] - bbox[0] + 50
    tag_x = (w - tag_w) // 2
    draw.rounded_rectangle([tag_x, 110, tag_x + tag_w, 170], radius=30, fill=(18, 28, 51), outline=accent_color, width=3)
    draw.text((tag_x + 25, 122), tag_text, font=tag_font, fill=accent_color)

    # Headline
    head_font = get_font(FONT_BOLD, 68)
    h_bbox = draw.textbbox((0, 0), headline_text, font=head_font)
    h_x = (w - (h_bbox[2] - h_bbox[0])) // 2
    draw.text((h_x, 200), headline_text, font=head_font, fill=(255, 255, 255))

    # Subtitle
    sub_font = get_font(FONT_REGULAR, 36)
    s_bbox = draw.textbbox((0, 0), subtitle_text, font=sub_font)
    s_x = (w - (s_bbox[2] - s_bbox[0])) // 2
    draw.text((s_x, 290), subtitle_text, font=sub_font, fill=(148, 163, 184))

    # Device Mockup Frame
    frame_w = 880
    frame_h = 1840
    frame_x = (w - frame_w) // 2
    frame_y = 440
    corner_r = 60

    # Device outer shadow / border glow
    draw.rounded_rectangle([frame_x - 8, frame_y - 8, frame_x + frame_w + 8, frame_y + frame_h + 8],
                           radius=corner_r + 6, outline=accent_color, width=4)
    draw.rounded_rectangle([frame_x, frame_y, frame_x + frame_w, frame_y + frame_h],
                           radius=corner_r, fill=(15, 23, 42), outline=(51, 65, 85), width=8)

    # Inner Screen Image
    screen_path = os.path.join(ARTIFACTS_DIR, screen_file)
    if os.path.exists(screen_path):
        screen_raw = Image.open(screen_path).convert("RGBA")
        inner_w = frame_w - 24
        inner_h = frame_h - 24
        screen_scaled = screen_raw.resize((inner_w, inner_h), Image.Resampling.LANCZOS)
        
        # Rounded mask for screen content
        mask = Image.new("L", (inner_w, inner_h), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle([0, 0, inner_w, inner_h], radius=corner_r - 10, fill=255)
        
        img.paste(screen_scaled, (frame_x + 12, frame_y + 12), mask=mask)

    # Dynamic Island / Camera punch hole on top of screen
    notch_w = 210
    notch_h = 44
    notch_x = (w - notch_w) // 2
    notch_y = frame_y + 24
    draw.rounded_rectangle([notch_x, notch_y, notch_x + notch_w, notch_y + notch_h], radius=22, fill=(0, 0, 0))

    dest = os.path.join(OUTPUT_DIR, output_name)
    img.save(dest, "PNG", optimize=True)
    print(f"  -> Saved {dest} ({os.path.getsize(dest)} bytes)")

def generate_screenshots():
    print("[3/3] Generating 1080x2400 Store Screenshots...")
    screens = [
        ("screenshot_01_dashboard.png", "CRUSH DAILY GOALS", "LEVEL UP YOUR PUSHUPS", "XP Progression, Streak Counter & Live Cloud Sync", "production_app_dashboard_live_bingo.png", (16, 185, 129)),
        ("screenshot_02_heatmap_calendar.png", "ACTIVITY MATRIX", "GITHUB-STYLE HEATMAP", "Visual Daily Pixel Grid & Consistency Telemetry", "github_final_pixel_heatmap.png", (34, 197, 94)),
        ("screenshot_03_egg_fuel.png", "NUTRITION TRACKER", "TRACK DAILY FUEL & EGGS", "Protein Fuel Logs, Calorie Stats & Target Paces", "screen_egg_matrix.png", (245, 158, 11)),
        ("screenshot_04_workout_arena.png", "WORKOUT ARENA", "HANDS-FREE REP COUNTING", "Smart Proximity Sensor for Automatic Tracking", "production_app_arena_live.png", (6, 182, 212)),
        ("screenshot_05_cloud_profile.png", "PROFILE & SECURITY", "ENTERPRISE CLOUD SYNC", "PIN Lock, Neon Postgres Cloud & GDPR Privacy", "production_app_logged_in_bingo.png", (139, 92, 246)),
    ]

    for item in screens:
        create_framed_screenshot(*item)

if __name__ == "__main__":
    generate_app_icon()
    generate_feature_graphic()
    generate_screenshots()
    print("ALL PLAY STORE ASSETS GENERATED SUCCESSFULLY!")
