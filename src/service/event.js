import axios from 'axios';
import { API_URL } from '../config.js';

export async function fetchEvents() {
    try {
      const { data } = await axios.get(`${API_URL}/sitemap/unindexList/events`);
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
}
