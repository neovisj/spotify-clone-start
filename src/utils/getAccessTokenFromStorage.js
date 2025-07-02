import { refreshToken } from './pkce';

export function getAccessTokenFromStorage() {
	const tokenFromLocalStorage = sessionStorage.getItem('spotifyToken');
	if (tokenFromLocalStorage !== null) {
		return tokenFromLocalStorage;
	}
	return false;
}

export function isTokenExpired() {
	const token = getAccessTokenFromStorage();
	if (!token) return true;

	// Check if token is expired using stored expiration time
	const expiresAt = sessionStorage.getItem('spotifyTokenExpiresAt');
	if (!expiresAt) return true;

	const now = Date.now();
	const expirationTime = parseInt(expiresAt);

	// Consider token expired if it expires within the next 5 minutes
	return now >= (expirationTime - 300000);
}

export async function getValidToken() {
	if (isTokenExpired()) {
		try {
			const newToken = await refreshToken();
			return newToken;
		} catch (error) {
			console.error('Failed to refresh token:', error);
			clearToken();
			return null;
		}
	}
	return getAccessTokenFromStorage();
}

export function clearToken() {
	sessionStorage.removeItem('spotifyToken');
	sessionStorage.removeItem('spotifyRefreshToken');
	sessionStorage.removeItem('spotifyTokenExpiresAt');
}

export async function checkPremiumStatus(spotifyApi) {
	try {
		const profile = await spotifyApi.getMe();
		return profile.body.product === 'premium';
	} catch (error) {
		console.error('Failed to check premium status:', error);
		return false;
	}
}