const { createApp } = Vue;
createApp({
  data() {
    return {
      users: [],
      selectedUser: null,
      selectedUserId: '',
      newUserName: '',
      restaurants: [],
      selectedRestaurant: null,
      selectedRestaurantId: '',
      menuItems: [],
      cart: {},
      viewMode: 'restaurants',
      userOrders: [],
      allMenuItems: []
    }
  },
  methods: {
    async fetchUsers() {
      const response = await fetch('/api/users/user');
      this.users = await response.json();
    },

    selectUser() {
      this.selectedUser = this.users.find(u => u.id === this.selectedUserId);
      this.viewMode = 'restaurants';
      this.loadUserOrders();
    },

    async addUser() {
      if (!this.newUserName) return;
      const response = await fetch('/api/users/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: this.newUserName })
      });
      const user = await response.json();
      this.users.push(user);
      this.selectedUserId = user.id;
      this.selectUser();
      this.newUserName = '';
    },

    async fetchRestaurants() {
      const response = await fetch('/api/restaurant/restaurants');
      this.restaurants = await response.json();
    },

    async selectRestaurant() {
      this.selectedRestaurant = this.restaurants.find(r => r.id === this.selectedRestaurantId);
      await this.fetchMenuItems();
    },

    async fetchMenuItems() {
      const response = await fetch(`/api/menu/restaurants/${this.selectedRestaurant.id}/menu-items`);
      this.menuItems = await response.json();
    },

    addToCart(itemId) {
      if (!this.cart[itemId]) this.cart[itemId] = 0;
      this.cart[itemId]++;
    },

    removeFromCart(itemId) {
      this.cart[itemId] = 0;
    },

    resetCart() {
      this.cart = {};
    },

    backToRestaurants() {
      this.selectedRestaurant = null;
      this.cart = {};
      loadUserOrders();
    },

    async loadUserOrders() {
      const response = await fetch(`/api/order/orders?customerId=${this.selectedUser.id}`);
      this.userOrders = await response.json();

      const menuResponse = await fetch('/api/menu/menu-items');
      this.allMenuItems = await menuResponse.json();
    },

    computeOrderTotal(order) {
      return order.items.reduce((sum, item) => {
        const menuItem = this.allMenuItems.find(m => m.id === item.menuItemId);
        return sum + (menuItem ? menuItem.priceHUF * item.quantity : 0);
      }, 0);
    },

    getRestaurantName(restaurantId) {
      const restaurant = this.restaurants.find(r => r.id === restaurantId);
      return restaurant ? restaurant.name : 'Unknown';
    },

    getMenuItemName(menuItemId) {
      const item = this.allMenuItems.find(i => i.id === menuItemId);
      return item ? item.name : 'Unknown';
    },

    async submitOrder() {
      const items = Object.entries(this.cart)
        .filter(([itemId, quantity]) => quantity > 0)
        .map(([itemId, quantity]) => ({
          menuItemId: itemId,
          quantity: quantity
        }));

      if (items.length === 0) return;

      const response = await fetch('/api/order/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: this.selectedUser.id,
          restaurantId: this.selectedRestaurant.id,
          items: items
        })
      });

      const order = await response.json();
      const total = this.cartTotal;
      alert(`Order placed successfully! Order ID: ${order.id}\nTotal: ${total} Ft`);
      this.cart = {};
      this.backToRestaurants();
    }
  },
  computed: {
    cartItems() {
      return this.menuItems
        .filter(item => this.cart[item.id] > 0)
        .map(item => ({
          id: item.id,
          name: item.name,
          quantity: this.cart[item.id],
          total: item.priceHUF * this.cart[item.id]
        }));
    },

    cartTotal() {
      return this.cartItems.reduce((sum, item) => sum + item.total, 0);
    },

    activeOrders() {
      return this.userOrders.filter(o => o.status !== 'delivering' && o.status !== 'delivered');
    },

    completedOrders() {
      return this.userOrders.filter(o => o.status === 'delivering' || o.status === 'delivered');
    }
  },

  mounted() {
    this.fetchUsers();
    this.fetchRestaurants();
    setInterval(() => {
      if (this.selectedUser && !this.selectedRestaurant) {
        this.loadUserOrders();
      }
    }, 5000);
  }
}).mount('#app');
