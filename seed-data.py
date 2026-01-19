#!/usr/bin/env python3
import requests
import json
import sys
import os

API_BASE = os.getenv('API_BASE', 'http://localhost')

def load_seed_data():
    with open('seed-data.json', 'r') as f:
        data = json.load(f)
    
    print('Seeding test data...')
    
    # Create users
    print('\nCreating users...')
    for user in data['users']:
        response = requests.post(f'{API_BASE}/api/users/user', json=user)
        print(f'  Created user: {response.json()["name"]}')
    
    # Create couriers
    print('\nCreating couriers...')
    for courier in data['couriers']:
        response = requests.post(f'{API_BASE}/api/courier/couriers', json=courier)
        print(f'  Created courier: {response.json()["name"]}')
    
    # Create restaurants and menu items
    print('\nCreating restaurants and menu items...')
    for restaurant in data['restaurants']:
        response = requests.post(f'{API_BASE}/api/restaurant/restaurants', json={
            'name': restaurant['name'],
            'category': restaurant['category']
        })
        restaurant_data = response.json()
        print(f'  Created restaurant: {restaurant_data["name"]}')
        
        for item in restaurant['menu']:
            item['restaurantId'] = restaurant_data['id']
            requests.post(f'{API_BASE}/api/menu/menu', json=item)
            print(f'    Added menu item: {item["name"]} - {item["price"]} Ft')
    
    print('\n✓ Seed data completed!')

if __name__ == '__main__':
    try:
        load_seed_data()
    except Exception as e:
        print(f'Error: {e}', file=sys.stderr)
        sys.exit(1)
