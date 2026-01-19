import requests
import random
import time
import os

API_BASE = os.getenv('API_BASE')

def get_couriers():
    response = requests.get(f'{API_BASE}/api/courier/couriers')
    return response.json()

def get_orders():
    response = requests.get(f'{API_BASE}/api/courier/orders')
    return response.json()

def update_order(order_id, status, courier_id=None):
    data = {'status': status}
    if courier_id:
        data['courierId'] = courier_id
    response = requests.put(f'{API_BASE}/api/courier/orders/{order_id}', json=data)
    return response.json()

def simulate_courier():
    couriers = get_couriers()

    if not couriers:
        print('No couriers available')
        return

    courier = random.choice(couriers)
    orders = get_orders()

    ready_orders = [o for o in orders if o['status'] == 'ready_for_courier' and not o.get('courierId')]
    assigned_orders = [o for o in orders if o['status'] == 'courier_assigned' and o.get('courierId') == courier['id']]
    delivering_orders = [o for o in orders if o['status'] == 'delivering' and o.get('courierId') == courier['id']]

    if ready_orders:
        order = random.choice(ready_orders)
        update_order(order['id'], 'courier_assigned', courier['id'])
        print(f'Courier {courier["name"]}: Accepted order {order["id"]}')
    elif assigned_orders:
        order = random.choice(assigned_orders)
        update_order(order['id'], 'delivering')
        print(f'Courier {courier["name"]}: Started delivering order {order["id"]}')
    elif delivering_orders:
        order = random.choice(delivering_orders)
        update_order(order['id'], 'delivered')
        print(f'Courier {courier["name"]}: Delivered order {order["id"]}')

if __name__ == '__main__':
    print('Virtual courier service started')
    while True:
        try:
            simulate_courier()
        except Exception as e:
            print(f'Error: {e}')
        time.sleep(random.randint(5, 15))
