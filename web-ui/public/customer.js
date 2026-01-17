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
      cart: {}
    }
  },
  methods: {
    async fetchUsers() {
      const response = await fetch('/api/customer/users');
      this.users = await response.json();
    },
    selectUser() {
      this.selectedUser = this.users.find(u => u.id === parseInt(this.selectedUserId));
    },
    async addUser() {
      if (!this.newUserName) return;
      const response = await fetch('/api/customer/users', {
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
      const response = await fetch('/api/menu/restaurants');
      this.restaurants = await response.json();
    },
    async selectRestaurant() {
      this.selectedRestaurant = this.restaurants.find(r => r.id === parseInt(this.selectedRestaurantId));
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
    }
  },
  mounted() {
    this.fetchUsers();
    this.fetchRestaurants();
  }
}).mount('#app');
