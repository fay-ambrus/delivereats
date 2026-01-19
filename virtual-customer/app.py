import requests
import random
import time
import os

API_BASE = os.getenv('API_BASE')

def get_users():
    response = requests.get(f'{API_BASE}/api/users/user')
    return response.json()

def get_restaurants():
    response = requests.get(f'{API_BASE}/api/restaurant/restaurants')
    return response.json()

def get_menu_items(restaurant_id):
    response = requests.get(f'{API_BASE}/api/menu/menu?restaurantId={restaurant_id}')
    return response.json()

def create_order(customer_id, restaurant_id, items):
    order = {
        'customerId': customer_id,
        'restaurantId': restaurant_id,
        'items': items
    }
    response = requests.post(f'{API_BASE}/api/order/orders', json=order)
    return response.json()

def simulate_customer():
    users = get_users()
    restaurants = get_restaurants()

    if not users or not restaurants:
        print('No users or restaurants available')
        return

    user = random.choice(users)
    restaurant = random.choice(restaurants)

    menu_items = get_menu_items(restaurant['id'])
    if not menu_items:
        print(f'No menu items for restaurant {restaurant["name"]}')
        return

    num_items = random.randint(1, 3)
    selected_items = random.sample(menu_items, min(num_items, len(menu_items)))
    items = [{'menuItemId': item['id'], 'quantity': random.randint(1, 2)} for item in selected_items]

    order = create_order(user['id'], restaurant['id'], items)
    print(f'Order created: {order["id"]} - {user["name"]} ordered from {restaurant["name"]}')

if __name__ == '__main__':
    print('Virtual customer service started')
    while True:
        try:
            simulate_customer()
        except Exception as e:
            print(f'Error: {e}')
        time.sleep(random.randint(10, 30))
