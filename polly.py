import pygame
import sys
import subprocess

pygame.init()
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Garbage Classification")

clock = pygame.time.Clock()

title_font = pygame.font.SysFont(None, 72)
text_font = pygame.font.SysFont(None, 32)
button_font = pygame.font.SysFont(None, 40)

title = title_font.render("Garbage Classification Game", True, (0, 0, 0))
description = [
    "Help Scotty sort garbage correctly!",
    "Use W A S D to move.",
    "Pick up trash and drop it into the right bin by approach the bin."
]

start_button = pygame.Rect(WIDTH // 2 - 120, HEIGHT // 2 + 80, 240, 60)
start_text = button_font.render("START GAME", True, (255, 255, 255))

running = True
while running:
    for event in pygame.event.get():

        # Close window
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

        # Mouse click
        if event.type == pygame.MOUSEBUTTONDOWN:
            if start_button.collidepoint(event.pos):
                pygame.quit()

                # Run the game file
                subprocess.run([sys.executable, "Nancy.py"])

                sys.exit()

    screen.fill((235, 235, 235))

    # Draw title
    screen.blit(
            title,
            (WIDTH // 2 - title.get_width() // 2, 80)
        )

    for i, line in enumerate(description):
            text_surface = text_font.render(line, True, (0, 0, 0))
            screen.blit(
                text_surface,
                (WIDTH // 2 - text_surface.get_width() // 2, 200 + i * 40)
            )

    pygame.draw.rect(screen, (0, 150, 0), start_button, border_radius=8)


    screen.blit(
            start_text,
            (
                start_button.centerx - start_text.get_width() // 2,
                start_button.centery - start_text.get_height() // 2
            )
        )

    pygame.display.update()
    clock.tick(60)