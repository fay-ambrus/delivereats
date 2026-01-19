import requests
import random
import time
import os

API_BASE = os.getenv('API_BASE')

def get_restaurants():
    response = requests.get(f'{API_BASE}/api/restaurant/restaurants')
    return response.json()

def get_orders(restaurant_id):
    response = requests.get(f'{API_BASE}/api/restaurant/orders?restaurantId={restaurant_id}')
    return response.json()

def update_order_status(order_id, status):
    response = requests.put(f'{API_BASE}/api/restaurant/orders/{order_id}', json={'status': status})
    return response.json()

def simulate_restaurant():
    restaurants = get_restaurants()

    if not restaurants:
        print('No restaurants available')
        return

    restaurant = random.choice(restaurants)
    orders = get_orders(restaurant['id'])

    pending_orders = [o for o in orders if o['status'] == 'pending']
    preparing_orders = [o for o in orders if o['status'] == 'preparing']
    packing_orders = [o for o in orders if o['status'] == 'packing']

    if pending_orders:
        order = random.choice(pending_orders)
        update_order_status(order['id'], 'preparing')
        print(f'Restaurant {restaurant["name"]}: Order {order["id"]} -> preparing')
    elif preparing_orders:
        order = random.choice(preparing_orders)
        update_order_status(order['id'], 'packing')
        print(f'Restaurant {restaurant["name"]}: Order {order["id"]} -> packing')
    elif packing_orders:
        order = random.choice(packing_orders)
        update_order_status(order['id'], 'ready_for_courier')
        print(f'Restaurant {restaurant["name"]}: Order {order["id"]} -> ready_for_courier')

if __name__ == '__main__':
    print('Virtual restaurant service started')
    while True:
        try:
            simulate_restaurant()
        except Exception as e:
            print(f'Error: {e}')
        time.sleep(random.randint(5, 15))
