import pygame
import sys
import random
import angela

pygame.init()

# background image
background = pygame.image.load("background.jpg")
bg_width, bg_height = background.get_size()
screen = pygame.display.set_mode((bg_width, bg_height))
pygame.display.set_caption("Garbage Classification")


# scotty dog image
scotty = pygame.image.load("scotty.webp")
scotty = pygame.transform.scale(scotty, (200, 150))

#scotty parameters
x = bg_width // 2
y = bg_height // 2
speed = 7

# recycle bin image
recycle_bin = pygame.image.load("recycle_bin.webp")
recycle_width, recycle_height = 200, 250
recycle_bin = pygame.transform.scale(recycle_bin, (recycle_width, recycle_height))

# hazardous bin image
hazardous_bin = pygame.image.load("hazardous.png")
hazardous_width, hazardous_height = 150, 250
hazardous_bin = pygame.transform.scale(hazardous_bin, (hazardous_width, hazardous_height))

# compost bin image
compost_bin = pygame.image.load("compost_bin.png")
compost_width, compost_height = 180, 280
compost_bin = pygame.transform.scale(compost_bin, (compost_width, compost_height))

# landfill bin image
landfill_bin = pygame.image.load("landfill_bin.jpg")
landfill_width, landfill_height = 180, 280
landfill_bin = pygame.transform.scale(landfill_bin, (landfill_width, landfill_height))

# category
recycle_trash = ["SodaCan.jpg", "WaterBottle.jpg", "GlassBottle.webp", "Newspaper.jpg", "Boxes.jpg"]
compost_trash = ["apple.jpg", "used_tissue.jpg", "banana_peel.webp", "bread.png", "egg.png"]
hazardous_trash = ["battery.png", "charger.png", "screen.png", "paint.png", "pills.png"]
landfill_trash = ["CandyWrapper.jpg", "PlasticBag.jpg", "clothing.jpg", "ChipBag.jpg", "used_gloves.webp"]

trash_list = recycle_trash + compost_trash + hazardous_trash + landfill_trash

# spawn random trash and location
def spawn_trash():
    image_name = random.choice(trash_list)
    img = pygame.image.load(image_name)
    img = pygame.transform.scale(img, (100, 100))
    x = random.randint(0, bg_width - 60)
    y = -60
    return image_name, img, x, y

def get_category(name):
    if name in recycle_trash:
        return "recycle"
    if name in compost_trash:
        return "compost"
    if name in hazardous_trash:
        return "hazardous"
    if name in landfill_trash:
        return "landfill"

# trash parameters
image_name, trash, trash_x, trash_y = spawn_trash()
trash_speed = 5

# other
holding_trash = False
score = 0

font = pygame.font.SysFont(None, 48)

clock = pygame.time.Clock()
life_state = {"lives": 3, "max_lives": 3, "invuln_frames": 0, "invuln_max": 20}

ui = {
    "screen": screen,
    "background": background,
    "clock": clock,
    "font_big": pygame.font.SysFont(None, 72),
    "font_small": pygame.font.SysFont(None, 42),
}

reset_args = {
    "bg_width": bg_width,
    "bg_height": bg_height,
    "spawn_trash": spawn_trash,
}

def apply_damage_and_handle(score, life_state, ui, reset_args,
                            x, y, holding_trash, image_name, trash, trash_x, trash_y):
    life_state, action, payload = angela.lose_blood(life_state, score, ui, reset_args)

    if action == "quit":
        return life_state, "quit", x, y, holding_trash, score, image_name, trash, trash_x, trash_y

    if action == "restart":
        x = payload["x"]
        y = payload["y"]
        score = payload["score"]
        holding_trash = payload["holding_trash"]
        image_name = payload["image_name"]
        trash = payload["trash"]
        trash_x = payload["trash_x"]
        trash_y = payload["trash_y"]
        return life_state, "restart", x, y, holding_trash, score, image_name, trash, trash_x, trash_y

    return life_state, "continue", x, y, holding_trash, score, image_name, trash, trash_x, trash_y


# position of bins
ground_y = bg_height - 40
recycle_x = 200
hazardous_x = 420
compost_x = 640
landfill_x = 860

recycle_y = ground_y - recycle_height
hazardous_y = ground_y - hazardous_height
compost_y = ground_y - compost_height
landfill_y = ground_y - landfill_height

while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

    keys = pygame.key.get_pressed()
    if life_state["invuln_frames"] > 0:
        life_state["invuln_frames"] -= 1

    if keys[pygame.K_w]:
        y -= speed
    if keys[pygame.K_s]:
        y += speed
    if keys[pygame.K_a]:
        x -= speed
    if keys[pygame.K_d]:
        x += speed

    #trash falls
    if not holding_trash:
        trash_y += trash_speed


    if trash_y > bg_height:
        life_state, action, payload = angela.lose_blood(life_state, score, ui, reset_args)

        if action == "quit":
            pygame.quit()
            sys.exit()

        if action == "restart":
            x = payload["x"]; y = payload["y"]
            score = payload["score"]
            holding_trash = payload["holding_trash"]
            image_name = payload["image_name"]
            trash = payload["trash"]
            trash_x = payload["trash_x"]
            trash_y = payload["trash_y"]
            continue

        # continue normally
        image_name, trash, trash_x, trash_y = spawn_trash()

    
    # rectangle for collision
    scotty_rect = pygame.Rect(x, y, 120, 80)
    trash_rect = pygame.Rect(trash_x, trash_y, 30, 30)
    recycle_bin_rect = pygame.Rect(recycle_x, recycle_y, recycle_width, recycle_height)
    hazardous_bin_rect = pygame.Rect(hazardous_x, hazardous_y, hazardous_width, hazardous_height)
    compost_bin_rect = pygame.Rect(compost_x, compost_y, compost_width, compost_height)
    landfill_bin_rect = pygame.Rect(landfill_x, landfill_y, landfill_width, landfill_height)

    # pick up trash
    if scotty_rect.colliderect(trash_rect):
        holding_trash = True

    # if holding, trash follows scotty
    if holding_trash:
        trash_x = x + 70
        trash_y = y - 40

        trash_type = get_category(image_name)

        # detect if dorp into the correct bin
        if scotty_rect.colliderect(recycle_bin_rect):
            if trash_type == "recycle":
                score += 1
            else:
                life_state, action, x, y, holding_trash, score, image_name, trash, trash_x, trash_y = apply_damage_and_handle(score, life_state, ui, reset_args, x, y, holding_trash, image_name, trash, trash_x, trash_y)

                if action == "quit":
                    pygame.quit()
                    sys.exit()
                if action == "restart":
                    continue

            holding_trash = False
            image_name, trash, trash_x, trash_y = spawn_trash()

        if scotty_rect.colliderect(hazardous_bin_rect):
            if trash_type == "hazardous":
                score += 1
            else:
                life_state, action, x, y, holding_trash, score, image_name, trash, trash_x, trash_y = apply_damage_and_handle(score, life_state, ui, reset_args, x, y, holding_trash, image_name, trash, trash_x, trash_y)

                if action == "quit":
                    pygame.quit()
                    sys.exit()
                if action == "restart":
                    continue

            holding_trash = False
            image_name, trash, trash_x, trash_y = spawn_trash()

        if scotty_rect.colliderect(compost_bin_rect):
            if trash_type == "compost":
                score += 1
            else:
                life_state, action, x, y, holding_trash, score, image_name, trash, trash_x, trash_y = apply_damage_and_handle(score, life_state, ui, reset_args, x, y, holding_trash, image_name, trash, trash_x, trash_y)

                if action == "quit":
                    pygame.quit()
                    sys.exit()
                if action == "restart":
                    continue
            holding_trash = False
            image_name, trash, trash_x, trash_y = spawn_trash()

        if scotty_rect.colliderect(landfill_bin_rect):
            if trash_type == "landfill":
                score += 1
            else:
                life_state, action, x, y, holding_trash, score, image_name, trash, trash_x, trash_y = apply_damage_and_handle(score, life_state, ui, reset_args, x, y, holding_trash, image_name, trash, trash_x, trash_y)

                if action == "quit":
                    pygame.quit()
                    sys.exit()
                if action == "restart":
                    continue
            holding_trash = False
            image_name, trash, trash_x, trash_y = spawn_trash()

    # draw everything
    screen.blit(background, (0, 0))
    screen.blit(scotty, (x, y))
    screen.blit(recycle_bin, (recycle_x, recycle_y))
    screen.blit(hazardous_bin, (hazardous_x, hazardous_y))
    screen.blit(compost_bin, (compost_x, compost_y))
    screen.blit(landfill_bin, (landfill_x, landfill_y))
    screen.blit(trash, (trash_x, trash_y))

    # draw score
    score_text = font.render(f"Score: {score}", True, (0, 0, 0))
    screen.blit(score_text, (20, 20))
    lives_text = font.render(f"Lives: {life_state['lives']}", True, (0, 0, 0))
    screen.blit(lives_text, (20, 60))

    
    pygame.display.update()
    clock.tick(60)