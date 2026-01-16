const { createApp } = Vue;
createApp({
  data() {
    return {
      restaurants: [],
      selectedRestaurant: null,
      selectedRestaurantId: '',
      newRestaurantName: ''
    }
  },
  methods: {
    async fetchRestaurants() {
      const response = await fetch('/api/menu/restaurants');
      this.restaurants = await response.json();
    },

    async addRestaurant() {
      if (!this.newRestaurantName) return;
      const response = await fetch('/api/menu/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: this.newRestaurantName })
      });
      const restaurant = await response.json();
      this.restaurants.push(restaurant);
      selectedRestaurantId = restaurant.id;
      this.newRestaurantName = '';
    },

    selectRestaurant() {
      this.selectedRestaurant = this.restaurants.find(r => r.id === parseInt(this.selectedRestaurantId));
    }
  },
  mounted() {
    this.fetchRestaurants();
  }
}).mount('#app');
