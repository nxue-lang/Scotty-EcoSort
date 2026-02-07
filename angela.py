import pygame
import sys

def lose_blood(life_state, score, ui, reset_args):
    # cooldown protection to avoid losing multiple hearts instantly
    if life_state["invuln_frames"] > 0:
        return life_state, "continue", None

    life_state["lives"] = max(0, life_state["lives"] - 1)
    life_state["invuln_frames"] = life_state["invuln_max"]

    if life_state["lives"] <= 0:
        action = game_over_page(score, ui)
        if action == "quit":
            return life_state, "quit", None

        # restart chosen -> reset EVERYTHING
        reset_payload = reset_game(reset_args)
        life_state["lives"] = life_state["max_lives"]
        life_state["invuln_frames"] = 0
        return life_state, "restart", reset_payload

    return life_state, "continue", None

def game_over_page(score, ui):
    screen = ui["screen"]
    background = ui["background"]
    clock = ui["clock"]
    font_big = ui["font_big"]
    font_small = ui["font_small"]

    w, h = screen.get_width(), screen.get_height()

    btn_w, btn_h = 220, 70
    restart_rect = pygame.Rect(w // 2 - btn_w - 20, 330, btn_w, btn_h)
    quit_rect    = pygame.Rect(w // 2 + 20,       330, btn_w, btn_h)

    def draw_button(rect, text, mouse_pos, mouse_clicked):
        hovered = rect.collidepoint(mouse_pos)
        pygame.draw.rect(screen, (230, 230, 230), rect)
        pygame.draw.rect(screen, (0, 0, 0), rect, 4 if hovered else 2)
        label = font_small.render(text, True, (0, 0, 0))
        screen.blit(label, (rect.centerx - label.get_width() // 2,
                            rect.centery - label.get_height() // 2))
        return hovered and mouse_clicked

    while True:
        mouse_pos = pygame.mouse.get_pos()
        mouse_clicked = False

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return "quit"
            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                mouse_clicked = True

        screen.blit(background, (0, 0))

        # overlay to make text readable
        overlay = pygame.Surface((w, h), pygame.SRCALPHA)
        overlay.fill((255, 255, 255, 200))
        screen.blit(overlay, (0, 0))

        title = font_big.render("GAME OVER", True, (0, 0, 0))
        screen.blit(title, (w // 2 - title.get_width() // 2, 140))

        final = font_small.render(f"Final Score: {score}", True, (0, 0, 0))
        screen.blit(final, (w // 2 - final.get_width() // 2, 220))

        if draw_button(restart_rect, "Restart", mouse_pos, mouse_clicked):
            return "restart"
        if draw_button(quit_rect, "Quit", mouse_pos, mouse_clicked):
            return "quit"

        pygame.display.update()
        clock.tick(60)

def reset_game(reset_args):
    bg_width = reset_args["bg_width"]
    bg_height = reset_args["bg_height"]
    spawn_trash = reset_args["spawn_trash"]

    # reset player
    x = bg_width // 2
    y = bg_height // 2

    # reset score and holding state
    score = 0
    holding_trash = False

    # reset trash
    image_name, trash, trash_x, trash_y = spawn_trash()

    return {
        "x": x,
        "y": y,
        "score": score,
        "holding_trash": holding_trash,
        "image_name": image_name,
        "trash": trash,
        "trash_x": trash_x,
        "trash_y": trash_y,
    }