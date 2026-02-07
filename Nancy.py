import pygame
import sys
import random

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
recycle_bin = pygame.transform.scale(recycle_bin, (200, 250))

# hazardous bin image
hazardous_bin = pygame.image.load("hazardous.png")
hazardous_bin = pygame.transform.scale(hazardous_bin, (180, 280))

# kitchen bin image
#compost_bin = pygame.image.load()

# landfill bin image
#landfill_bin = pygame.image.load()

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
        return "kitchen"
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

while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

    keys = pygame.key.get_pressed()

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

    # reset if missed
    if trash_y > bg_height:
        image_name, trash, trash_x, trash_y = spawn_trash()
    
    # rectangle for collision
    scotty_rect = pygame.Rect(x, y, 200, 150)
    trash_rect = pygame.Rect(trash_x, trash_y, 60, 60)
    recycle_bin_rect = pygame.Rect(320, 250, 200, 250)
    hazardous_bin_rect = pygame.Rect(420, 270, 200, 250)

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
            holding_trash = False
            image_name, trash, trash_x, trash_y = spawn_trash()

        if scotty_rect.colliderect(hazardous_bin_rect):
            if trash_type == "hazardous":
                score += 1
            holding_trash = False
            image_name, trash, trash_x, trash_y = spawn_trash()



    # draw everything
    screen.blit(background, (0, 0))
    screen.blit(scotty, (x, y))
    screen.blit(recycle_bin, (320, 270))
    screen.blit(hazardous_bin, (420, 270))
    screen.blit(trash, (trash_x, trash_y))

    # draw score
    score_text = font.render(f"Score: {score}", True, (0, 0, 0))
    screen.blit(score_text, (20, 20))
    
    pygame.display.update()
    clock.tick(60)
