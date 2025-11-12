// Football Data API Helper Module
const API_BASE_URL = 'https://api.football-data.org/v4';

const getHeaders = () => {
  const apiKey = process.env.NEXT_PUBLIC_FOOTBALL_API_TOKEN;
  
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_FOOTBALL_API_TOKEN is not set in environment variables');
  }

  return {
    'X-Auth-Token': apiKey,
    'Content-Type': 'application/json',
  };
};

// Generic API request handler
const apiRequest = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders()
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `API Error ${response.status}: ${errorData.message || response.statusText}`
      )
    }

    return await response.json()
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to football-data.org API')
    }
    throw error
  }
}

/**
 * Get teams for a specific league/competition
 * @param {string} leagueCode - Competition code (e.g., 'PL', 'PD', 'SA', 'FL1', 'BL1')
 * @returns {Promise<Object>} API response with teams data
 */
export const getTeams = async (leagueCode) => {
  try {
    const response = await fetch(`/api/teams/${leagueCode}`)
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.error('[getTeams] HTTP', response.status, text)
      return { success: false, data: { teams: [] }, error: `HTTP ${response.status}: ${text}` }
    }
    const data = await response.json()
    if (!data) {
      console.error('[getTeams] Empty JSON body')
      return { success: false, data: { teams: [] }, error: 'Empty response body' }
    }
    const teams = Array.isArray(data?.teams) ? data.teams : (Array.isArray(data?.data) ? data.data : [])
    return { success: true, data: { teams }, error: null }
  } catch (error) {
    console.error('Error fetching teams:', error)
    return { success: false, data: { teams: [] }, error: error?.message || String(error) }
  }
};

/**
 * Get upcoming fixtures for a specific team
 * @param {number} teamId - Team ID from football-data.org
 * @returns {Promise<Object>} API response with fixtures data
 */
export const getFixtures = async (teamId, leagueCode) => {
  try {
    const url = leagueCode 
      ? `/api/fixtures/${teamId}?leagueCode=${leagueCode}`
      : `/api/fixtures/${teamId}`;

    const response = await fetch(url)
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.error('[getFixtures] HTTP', response.status, text)
      return { success: false, data: { fixtures: [] }, error: `HTTP ${response.status}: ${text}` }
    }
    const data = await response.json()
    if (!data) {
      console.error('[getFixtures] Empty JSON body')
      return { success: false, data: { fixtures: [] }, error: 'Empty response body' }
    }
    const fixtures = Array.isArray(data?.fixtures) ? data.fixtures : (Array.isArray(data?.data) ? data.data : [])
    return { success: true, data: { fixtures }, error: null }
  } catch (error) {
    console.error('Error fetching fixtures:', error)
    return { success: false, data: { fixtures: [] }, error: error?.message || String(error) }
  }
};

/**
 * Get league standings for a specific competition
 * @param {string} leagueCode - League code (e.g., 'PL', 'PD', 'SA')
 * @returns {Promise<Array>} API response with standings data
 */
export const getStandings = async (leagueCode) => {
  try {
    const response = await fetch(`/api/standings/${leagueCode}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching standings:', error);
    throw error;
  }
};

/**
 * Get competition information
 * @param {string} leagueCode - Competition code
 * @returns {Promise<Object>} API response with competition data
 */
export const getCompetition = async (leagueCode) => {
  if (!leagueCode) {
    throw new Error('League code is required')
  }

  try {
    const data = await apiRequest(`/competitions/${leagueCode}`)
    
    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        code: data.code,
        type: data.type,
        emblem: data.emblem,
        currentSeason: data.currentSeason,
        numberOfAvailableSeasons: data.numberOfAvailableSeasons,
        lastUpdated: data.lastUpdated
      },
      error: null
    }
  } catch (error) {
    console.error(`Error fetching competition ${leagueCode}:`, error.message)
    return {
      success: false,
      data: null,
      error: error.message
    }
  }
}

/**
 * Check API connection and rate limits
 * @returns {Promise<Object>} API connection status
 */
export const checkApiStatus = async () => {
  try {
    // Use a lightweight endpoint to check API status
    const response = await fetch(`${API_BASE_URL}/competitions`, {
      method: 'HEAD',
      headers: getHeaders()
    })

    return {
      success: response.ok,
      status: response.status,
      rateLimit: {
        remaining: response.headers.get('X-Requests-Available-Minute'),
        reset: response.headers.get('X-RequestCounter-Reset')
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Export all functions
export default {
  getTeams,
  getFixtures,
  getCompetition,
  checkApiStatus
}
