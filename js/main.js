let restaurants,
  neighborhoods,
  cuisines
var mapUrl
const mapApiKey = "AIzaSyAfn6irkVjamwVeR6wVnRJ7fzL4x2Mhb_8"

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */

document.body.onload = (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  // Using static google maps api to get better performances
  // https://developers.google.com/maps/documentation/static-maps/intro
  mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=1280x200&scale=2&zoom=11&center=40.722216,-73.987501&key=${mapApiKey}&markers=size:mid%7Ccolor:red`

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML(restaurants);
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants) => {
  const div = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    div.append(createRestaurantHTML(restaurant));
    mapUrl += `%7C${restaurant.latlng.lat},${restaurant.latlng.lng}`;
  });

  var bLazy = new Blazy({
    // Options
  });

  const mapImg = document.getElementById('map');
  mapImg.alt = 'Map containing all restaurants locations';
  mapImg.src = mapUrl;
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const article = document.createElement('article');

  const image = document.createElement('img');
  image.className = 'restaurant-img b-lazy';
  image.alt = `Restaurant ${restaurant.name} in ${restaurant.neighborhood}. Cuisine type is ${restaurant.cuisine_type}`;
  image.setAttribute("data-src", DBHelper.imageUrlForRestaurant(restaurant));
  article.append(image);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  article.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  article.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  article.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);

  const favorite = document.createElement('a');
  favorite.innerHTML = 'Favorite';
  favorite.href = '#';
  favorite.addEventListener('click', () => {
    DBHelper.toggleFavoriteRestaurant();
  });

  const buttonsContainer = document.createElement('div');
  buttonsContainer.append(more);
  buttonsContainer.append(favorite);

  article.append(buttonsContainer);

  return article
}

/**
 * @description Register Service Worker
 */
AppHelper.registerServiceWorker();

/**
 * @description Fetch and update all restaurants from the network
 */
DBHelper.fetchRestaurants();

/**
 * @description Fetch and update all reviews from the network
 */
DBHelper.fetchReviews();