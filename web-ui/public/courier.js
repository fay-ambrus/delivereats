const { createApp } = Vue;
createApp({
  data() {
    return {
      users: [],
      selectedUser: null,
      selectedUserId: '',
      newUserName: '',
      restaurants: [],
      allOrders: []
    }
  },
  methods: {
    async fetchUsers() {
      const response = await fetch('/api/courier/couriers');
      this.users = await response.json();
    },

    selectUser() {
      this.selectedUser = this.users.find(u => u.id === this.selectedUserId);
      this.loadOrders();
    },

    async addUser() {
      if (!this.newUserName) return;
      const response = await fetch('/api/courier/couriers', {
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

    async loadOrders() {
      const response = await fetch('/api/order/orders');
      this.allOrders = await response.json();
    },

    getRestaurantName(restaurantId) {
      const restaurant = this.restaurants.find(r => r.id === restaurantId);
      return restaurant ? restaurant.name : 'Unknown';
    },

    async acceptOrder(orderId) {
      await fetch(`/api/order/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'courier_assigned', courierId: this.selectedUser.id })
      });
      await this.loadOrders();
    },

    async updateOrderStatus(orderId, newStatus) {
      await fetch(`/api/order/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      await this.loadOrders();
    },

    prettyPrintStatus(status) {
      return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  },

  computed: {
    availableOrders() {
      return this.allOrders.filter(o => o.status === 'ready_for_courier');
    },

    myActiveOrders() {
      return this.allOrders.filter(o =>
        o.courierId == this.selectedUser.id &&
        (o.status === 'courier_assigned' || o.status === 'delivering')
      );
    },

    myCompletedOrders() {
      return this.allOrders.filter(o =>
        o.courierId === this.selectedUser.id &&
        o.status === 'delivered'
      );
    }
  },

  mounted() {
    this.fetchUsers();
    this.fetchRestaurants();
    setInterval(() => {
      if (this.selectedUser) {
        this.loadOrders();
      }
    }, 5000);
  }
}).mount('#app');
