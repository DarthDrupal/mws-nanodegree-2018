let restaurant;
const mapApiKey = "AIzaSyAfn6irkVjamwVeR6wVnRJ7fzL4x2Mhb_8";

/**
 * Fetch restaurant info as soon as the page is loaded.
 */
document.body.onload = (event) => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      fillBreadcrumb();

      let mapUrl = `https://maps.googleapis.com/maps/api/staticmap?scale=2&markers=size:mid%7Ccolor:red%7C${restaurant.latlng.lat},${restaurant.latlng.lng}&key=${mapApiKey}`;

      const sourceSmall = document.createElement("source");
      sourceSmall.srcset = `${mapUrl}&size=1280x300`;
      sourceSmall.media = "(max-width: 600px)";

      const sourceHigh = document.createElement("source");
      sourceHigh.srcset = `${mapUrl}&size=450x1280`;
      sourceHigh.media = "(min-width: 601px)";

      const image = document.createElement("img");
      image.setAttribute("id", "map");
      image.alt = `Map for ${restaurant.name} in ${restaurant.neighborhood}.`;
      image.src = `${mapUrl}&size=1280x300`;

      const picture = document.getElementById('map-picture');
      picture.appendChild(sourceSmall);
      picture.appendChild(sourceHigh);
      picture.appendChild(image);

      const cuisine = document.getElementById('restaurant-cuisine');
      cuisine.innerHTML = restaurant.cuisine_type;
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const source = document.createElement("source");
  source.srcset = `/img/low_${restaurant.id}.webp`;
  source.media = "(min-width: 700px)";

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.alt = `Restaurant ${restaurant.name} in ${restaurant.neighborhood}. Cuisine type is ${restaurant.cuisine_type}`;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const picture = document.getElementById('restaurant-pic');
  picture.insertBefore(source, image);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  // fill favorite toggle element
  fillFavoriteHTML();

  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create favorite toggle
 */
fillFavoriteHTML = (restaurant = self.restaurant) => {
  const favorite = document.getElementById('favorite-toggle');

  favorite.id = `restaurant-${restaurant.id}`;
  favorite.className = `favorite-${restaurant.is_favorite}`;
  favorite.setAttribute('favorite', restaurant.is_favorite);
  favorite.addEventListener('click', () => {
    DBHelper.toggleFavoriteRestaurant(restaurant.id);
  });
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const div = document.getElementById('reviews-list');
  reviews.forEach(review => {
    div.appendChild(createReviewHTML(review));
  });
  container.appendChild(div);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const article = document.createElement('article');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  article.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  article.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  article.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  article.appendChild(comments);

  return article;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.setAttribute('aria-current', 'page');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

AppHelper.registerServiceWorker();

/**
 * @description Fetch and update all restaurants from the network
 */
DBHelper.fetchRestaurants();