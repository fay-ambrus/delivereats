import requests
import random
import time
import os
import sys

API_BASE = os.getenv('API_BASE')

print(f'Virtual restaurant starting with API_BASE: {API_BASE}', flush=True)

def get_restaurants():
    response = requests.get(f'{API_BASE}/api/restaurant/restaurants')
    response.raise_for_status()
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
        print('No restaurants available', flush=True)
        return

    restaurant = random.choice(restaurants)
    orders = get_orders(restaurant['id'])

    pending_orders = [o for o in orders if o['status'] == 'pending']
    preparing_orders = [o for o in orders if o['status'] == 'preparing']
    packing_orders = [o for o in orders if o['status'] == 'packing']

    if pending_orders:
        order = random.choice(pending_orders)
        update_order_status(order['id'], 'preparing')
        print(f'Restaurant {restaurant["name"]}: Order {order["id"]} -> preparing', flush=True)
    elif preparing_orders:
        order = random.choice(preparing_orders)
        update_order_status(order['id'], 'packing')
        print(f'Restaurant {restaurant["name"]}: Order {order["id"]} -> packing', flush=True)
    elif packing_orders:
        order = random.choice(packing_orders)
        update_order_status(order['id'], 'ready_for_courier')
        print(f'Restaurant {restaurant["name"]}: Order {order["id"]} -> ready_for_courier', flush=True)

if __name__ == '__main__':
    print('Virtual restaurant service started', flush=True)
    print(f'API_BASE: {API_BASE}', flush=True)
    while True:
        try:
            simulate_restaurant()
        except Exception as e:
            print(f'Error: {e}', flush=True)
            import traceback
            traceback.print_exc()
        time.sleep(random.randint(100, 1000) / 1000.0)
