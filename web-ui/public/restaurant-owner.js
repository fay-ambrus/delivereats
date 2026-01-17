const { createApp } = Vue;
createApp({
  data() {
    return {
      restaurants: [],
      selectedRestaurant: null,
      selectedRestaurantId: '',
      newRestaurantName: '',
      menuItems: [],
      editingItem: null,
      newItem: { name: '', priceHUF: '' },
      restaurantCategory: '',
      restaurantOrders: []
    }
  },
  methods: {
    async fetchRestaurants() {
      const response = await fetch('/api/restaurant/restaurants');
      this.restaurants = await response.json();
    },

    async selectRestaurant() {
      this.selectedRestaurant = this.restaurants.find(r => r.id === this.selectedRestaurantId);
      this.restaurantCategory = this.selectedRestaurant.category || '';
      await this.fetchMenuItems();
      await this.fetchRestaurantOrders();
    },

    async addRestaurant() {
      if (!this.newRestaurantName) return;
      const response = await fetch('/api/restaurant/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: this.newRestaurantName })
      });
      const restaurant = await response.json();
      this.restaurants.push(restaurant);
      this.selectedRestaurantId = restaurant.id;
      this.selectRestaurant();
      this.newRestaurantName = '';
    },

    async updateRestaurantCategory() {
      const response = await fetch(`/api/restaurant/restaurants/${this.selectedRestaurant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.selectedRestaurant.name,
          category: this.restaurantCategory
        })
      });
      const updated = await response.json();
      this.selectedRestaurant = updated;
      const index = this.restaurants.findIndex(r => r.id === updated.id);
      this.restaurants[index] = updated;
    },

    async fetchMenuItems() {
      const response = await fetch(`/api/menu/restaurants/${this.selectedRestaurant.id}/menu-items`);
      this.menuItems = await response.json();
    },

    async addMenuItem() {
      if (!this.newItem.name || !this.newItem.priceHUF) return;
      const response = await fetch('/api/menu/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.newItem.name,
          priceHUF: parseInt(this.newItem.priceHUF),
          restaurantId: this.selectedRestaurant.id
        })
      });
      const item = await response.json();
      this.menuItems.push(item);
      this.newItem = { name: '', priceHUF: '' };
    },

    editItem(item) {
      this.editingItem = { ...item };
    },

    async saveItem() {
      const response = await fetch(`/api/menu/menu-items/${this.editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.editingItem.name,
          priceHUF: parseInt(this.editingItem.priceHUF),
          restaurantId: this.selectedRestaurant.id
        })
      });
      const updated = await response.json();
      const index = this.menuItems.findIndex(i => i.id === updated.id);
      this.menuItems[index] = updated;
      this.editingItem = null;
    },

    cancelEdit() {
      this.editingItem = null;
    },

    async deleteItem(id) {
      await fetch(`/api/menu/menu-items/${id}`, { method: 'DELETE' });
      this.menuItems = this.menuItems.filter(i => i.id !== id);
    },

    async fetchRestaurantOrders() {
      const response = await fetch(`/api/order/orders?restaurantId=${this.selectedRestaurant.id}`);
      this.restaurantOrders = await response.json();
    },

    getMenuItemName(menuItemId) {
      const item = this.menuItems.find(i => i.id === menuItemId);
      return item ? item.name : 'Unknown';
    }
  },

  mounted() {
    this.fetchRestaurants();
  }
}).mount('#app');
