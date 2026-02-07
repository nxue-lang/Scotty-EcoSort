import pygame
import sys
import subprocess

pygame.init()


def wrap_text(text, font, max_width):
    """
    Splits text into a list of lines that fit within max_width.
    """
    words = text.replace("\n", " \n ").split(" ")
    lines = []
    current_line = ""

    for word in words:
        if word == "\n":
            lines.append(current_line)
            current_line = ""
            continue

        test_line = current_line + (" " if current_line else "") + word
        if font.size(test_line)[0] <= max_width:
            current_line = test_line
        else:
            lines.append(current_line)
            current_line = word

    if current_line:
        lines.append(current_line)

    return lines



WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Garbage Classification")

clock = pygame.time.Clock()

title_font = pygame.font.SysFont(None, 72)
text_font = pygame.font.SysFont(None, 32)
button_font = pygame.font.SysFont(None, 40)

CLOSE_BTN_SIZE = 30
close_button = None

title = title_font.render("Garbage Classification Game", True, (0, 0, 0))
description = [
    "Help Scotty sort garbage correctly!",
    "Use W A S D to move.",
    "Pick up trash and drop it into the right bin by approach the bin."
]

bg_image = pygame.image.load("startingbackground.jpg").convert_alpha()
bg_image = pygame.transform.scale(bg_image, (WIDTH, HEIGHT))


#the spinning Garbage bins
recycle_img = pygame.image.load("recycle_bin.webp").convert_alpha()
landfill_img = pygame.image.load("landfill_bin.jpg").convert_alpha()
hazardous_img = pygame.image.load("hazardous.png").convert_alpha()
compost_img = pygame.image.load("compost_bin.png").convert_alpha()

#create an array of garbage bins
BIN_SIZE = 100
BIN_MARGIN = 20
ROTATION_SPEED = 40  # degrees per frame

bins = [
    {
        "image": pygame.transform.scale(recycle_img,(BIN_SIZE, BIN_SIZE)),
        "pos": (BIN_MARGIN, BIN_MARGIN),
        "angle": 0,
        "info": "Recyclables are waste that can be reused after reprocessing. \nExamples:\nPlastic bottles, cans,\nnewspaper, cardboard,glassbottle."
    },
    {
        "image": pygame.transform.scale(hazardous_img,(BIN_SIZE, BIN_SIZE)),
        "pos": (WIDTH - BIN_SIZE - BIN_MARGIN, BIN_MARGIN),
        "angle": 0,
        "info": "Hazardous waste are waste that cannot be disposed directly because they are harmful to the environment.\n Examples: electronics, chemicals, wastes that are harmful to the environment."
    },
    {
        "image": pygame.transform.scale(compost_img,(BIN_SIZE, BIN_SIZE)),
        "pos": (BIN_MARGIN, HEIGHT - BIN_SIZE - BIN_MARGIN),
        "angle": 0,
        "info" : "Compost waste are waste that can be processed into decomposed by microorganisms in an oxygen-rich environment:\n Examples:food waste, fruit peels, bread."
    },
    {
        "image": pygame.transform.scale(landfill_img,(BIN_SIZE, BIN_SIZE)),
        "pos": (WIDTH - BIN_SIZE - BIN_MARGIN, HEIGHT - BIN_SIZE - BIN_MARGIN),
        "angle": 0,
        "info": "Landfill waste are waste that are disposed into the ground.\n Examples:\nChip bags,\nused gloves,\nwrappers, plastic bags."
    }
]
#Scale them and keep and original copy


start_button = pygame.Rect(WIDTH // 2 - 120, HEIGHT // 2 + 80, 240, 60)
start_text = button_font.render("START GAME", True, (255, 255, 255))

info_message = None
info_font = pygame.font.SysFont(None, 28)

running = True
while running:
    for event in pygame.event.get():

        # Close window
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

        # Mouse click
        if event.type == pygame.MOUSEBUTTONDOWN:

            if close_button and close_button.collidepoint(event.pos):
                info_message = None
                close_button = None
                continue  # stop this click from doing anything else
            
            for bin_data in bins:
                bin_rect = pygame.Rect(
                    bin_data["pos"][0],
                    bin_data["pos"][1],
                    BIN_SIZE,
                    BIN_SIZE
                )
                if bin_rect.collidepoint(event.pos):
                    info_message = bin_data["info"]
                    break
            
            if start_button.collidepoint(event.pos):
                pygame.quit()

                # Run the game file
                subprocess.run([sys.executable, "new_nancy.py"])

                sys.exit()

    screen.blit(bg_image, (0, 0))
    fade_overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
    fade_overlay.fill((255, 255, 255, 120))  # (R, G, B, alpha)
    screen.blit(fade_overlay, (0, 0))
    # Draw title
    screen.blit(
    title,
    (WIDTH // 2 - title.get_width() // 2, 130)
    )

# Draw description text (multiple lines)
    for i, line in enumerate(description):
        text_surface = text_font.render(line, True, (0, 0, 0))
        screen.blit(
            text_surface,
            (WIDTH // 2 - text_surface.get_width() // 2, 200 + i * 40)
        )

# Draw start button
    pygame.draw.rect(
        screen,
        (0, 150, 0),
        start_button,
        border_radius=8
    )

    screen.blit(
            start_text,
            (
                start_button.centerx - start_text.get_width() // 2,
                start_button.centery - start_text.get_height() // 2
            )
        )
    

    # Draw rotating bins

    for bin_data in bins:
        # Increase rotation angle
        bin_data["angle"] = (bin_data["angle"] + ROTATION_SPEED) % 360

        # Rotate image
        rotated_image = pygame.transform.rotate(
            bin_data["image"],
            bin_data["angle"]
        )

        # Keep rotation centered
        rotated_rect = rotated_image.get_rect(
            center=(
                bin_data["pos"][0] + BIN_SIZE // 2,
                bin_data["pos"][1] + BIN_SIZE // 2
            )
        )
        # Draw bin
        screen.blit(rotated_image, rotated_rect.topleft)

        if rotated_rect.collidepoint(pygame.mouse.get_pos()):
            pygame.draw.rect(screen, (255,0,0), rotated_rect, 2)

    if info_message:
        # Background box
        box_rect = pygame.Rect(150, HEIGHT // 2 - 80, WIDTH - 250, 200)
        pygame.draw.rect(screen, (255, 255, 255), box_rect)
        pygame.draw.rect(screen, (0, 0, 0), box_rect, 2)
        
        close_button = pygame.Rect(
        box_rect.right - CLOSE_BTN_SIZE + 5,
        box_rect.top - 10,
        CLOSE_BTN_SIZE,
        CLOSE_BTN_SIZE
        )

        pygame.draw.rect(screen, (200, 0, 0), close_button, border_radius=5)
        x_text = info_font.render("X", True, (255, 255, 255))
        screen.blit(
            x_text,
            (
                close_button.centerx - x_text.get_width() // 2,
                close_button.centery - x_text.get_height() // 2
            )
        )

            # Draw multiline text
        wrapped_lines = wrap_text(
            info_message,
            info_font,
            box_rect.width - 40  # padding inside box
        )
        for i, line in enumerate(wrapped_lines):
            text_surf = info_font.render(line, True, (0, 0, 0))
            screen.blit(
            text_surf,
            (box_rect.x + 20, box_rect.y + 20 + i * 30))
    else:
        close_button = None

    
    pygame.display.update()
    clock.tick(60)