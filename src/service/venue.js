import axios from 'axios';
import { API_URL } from '../config.js';

export async function fetchVenues() {
    try {
      const { data } = await axios.get(`${API_URL}/sitemap/unindexList/venues`);
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
}

export async function fetchExternalVenues() {
    try {
      const { data } = await axios.get(`${API_URL}/sitemap/unindexList/externalVenues`);
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
}
