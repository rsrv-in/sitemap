import axios from 'axios';
import { API_URL } from '../config.js';

//sets event and venue ids as indexed
export async function setAsIndexed(ids) {
    try {
      const { data } = await axios.post(`${API_URL}/sitemap/setAsIndexed`,{
        ids
      });
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
}
