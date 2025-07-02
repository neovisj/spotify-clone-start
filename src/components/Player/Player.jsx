import React, { useEffect, useState, useRef } from 'react';
import { Box, Grid, Typography, Avatar } from '@mui/material';
import { getAccessTokenFromStorage, isTokenExpired, clearToken, getValidToken, checkPremiumStatus } from '../../utils/getAccessTokenFromStorage';
import PlayerControls from '../PlayerControls/PlayerControls';
import PlayerVolume from '../PlayerVolume/PlayerVolume';
import PlayerOverlay from '../PlayerOverlay/PlayerOverlay';

const Player = ({ spotifyApi }) => {
	const [localPlayer, setPlayer] = useState(null);
	const [is_paused, setPaused] = useState(false);
	const [current_track, setTrack] = useState(null);
	const [device, setDevice] = useState(null);
	const [duration, setDuration] = useState(null);
	const [progress, setProgress] = useState(null);
	const [playerOverlayIsOpen, setPlayerOverlayIsOpen] = useState(false);
	const [playerError, setPlayerError] = useState(null);
	const [isConnected, setIsConnected] = useState(false);
	const playerRef = useRef(null);
	const reconnectTimeoutRef = useRef(null);

	// Suppress known Spotify analytics errors that don't affect functionality
	useEffect(() => {
		const originalConsoleError = console.error;
		console.error = (...args) => {
			const message = args.join(' ');
			// Filter out known Spotify analytics 404 errors
			if (message.includes('cpapi.spotify.com') && message.includes('404')) {
				return; // Don't log these errors
			}
			if (message.includes('CloudPlaybackClientError') && message.includes('PlayLoad event failed')) {
				return; // Don't log these errors
			}
			if (message.includes('Cannot read properties of null')) {
				return; // Don't log null player errors
			}
			originalConsoleError.apply(console, args);
		};

		return () => {
			console.error = originalConsoleError;
		};
	}, []);

	const reconnectPlayer = async () => {
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
		}

		reconnectTimeoutRef.current = setTimeout(async () => {
			console.log('Attempting to reconnect player...');
			setIsConnected(false);
			setPlayer(null);
			playerRef.current = null;

			// Re-initialize the player
			await initializePlayer();
		}, 2000); // Wait 2 seconds before reconnecting
	};

	const initializePlayer = async () => {
		try {
			// Check if user has Premium account
			const isPremium = await checkPremiumStatus(spotifyApi);
			if (!isPremium) {
				setPlayerError('Spotify Premium is required to use the Web Playback SDK. Please upgrade your account.');
				return;
			}

			// Get a valid token (refresh if needed)
			const token = await getValidToken();

			if (!token) {
				console.error('Player: No valid token available');
				setPlayerError('No valid token available. Please log in again.');
				clearToken();
				window.location.href = '/login';
				return;
			}

			// Remove existing script if it exists
			const existingScript = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
			if (existingScript) {
				existingScript.remove();
			}

			const script = document.createElement('script');
			script.src = 'https://sdk.scdn.co/spotify-player.js';
			script.async = true;
			document.body.appendChild(script);

			window.onSpotifyWebPlaybackSDKReady = () => {
				const player = new window.Spotify.Player({
					name: 'Neo Playback',
					getOAuthToken: async (cb) => {
						// Get fresh token each time it's needed
						const freshToken = await getValidToken();
						if (freshToken) {
							cb(freshToken);
						} else {
							console.error('Failed to get valid token for player');
							setPlayerError('Authentication failed. Please log in again.');
							clearToken();
							window.location.href = '/login';
						}
					},
					volume: 0.5
				});

				player.addListener('ready', ({ device_id }) => {
					console.log('Ready with Device ID', { device_id, player });
					setDevice(device_id);
					setPlayer(player);
					playerRef.current = player;
					setPlayerError(null);
					setIsConnected(true);
				});

				player.addListener('not_ready', ({ device_id }) => {
					console.log('Device ID has gone offline', device_id);
					setIsConnected(false);
					setPlayerError('Player device went offline');
					reconnectPlayer();
				});

				player.addListener('initialization_error', ({ message }) => {
					console.error('Failed to initialize player:', message);
					setPlayerError(`Failed to initialize player: ${message}`);
					reconnectPlayer();
				});

				player.addListener('authentication_error', ({ message }) => {
					console.error('Failed to authenticate:', message);
					setPlayerError('Authentication failed. Please log in again.');
					clearToken();
					window.location.href = '/login';
				});

				player.addListener('account_error', ({ message }) => {
					console.error('Failed to validate Spotify account:', message);
					setPlayerError('Account validation failed. Please check your Spotify account.');
				});

				player.addListener('playback_error', ({ message }) => {
					console.error('Failed to perform playback:', message);
					setPlayerError(`Playback error: ${message}`);
				});

				player.addListener('player_state_changed', (state) => {
					if (!state || !state.track_window?.current_track) {
						return;
					}
					const duration_ms = state.track_window.current_track.duration_ms / 1000;
					const position_ms = state.position / 1000;
					setDuration(duration_ms);
					setProgress(position_ms);
					setTrack(state.track_window.current_track);
					setPaused(state.paused);
				});

				// Store player reference
				playerRef.current = player;
				setPlayer(player);

				// Connect the player
				player.connect().catch(error => {
					console.error('Player: Error connecting:', error);
					setPlayerError('Failed to connect to Spotify player');
					reconnectPlayer();
				});
			};
		} catch (error) {
			console.error('Player: Error initializing:', error);
			setPlayerError('Failed to initialize player');
			reconnectPlayer();
		}
	};

	useEffect(() => {
		initializePlayer();

		// Cleanup function
		return () => {
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
			if (playerRef.current) {
				playerRef.current.disconnect();
			}
		};
	}, [spotifyApi]);

	useEffect(() => {
		const transferMyPlayback = async () => {
			if (device && isConnected) {
				try {
					await spotifyApi.transferMyPlayback([device], true);
				} catch (error) {
					console.error('Player: Error transferring playback:', error);
					setPlayerError('Failed to transfer playback to this device');
				}
			}
		};
		const getDeviceFromApi = async () => {
			try {
				const devices = await spotifyApi.getMyDevices();
			} catch (error) {
				console.error('Player: Error getting devices:', error);
			}
		};
		getDeviceFromApi();
		transferMyPlayback();
	}, [device, spotifyApi, isConnected]);

	// Show error message if there's a player error
	if (playerError) {
		return (
			<Box sx={{ bgcolor: 'background.paper', height: 100, borderTop: '1px solid #292929', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Typography sx={{ color: 'error.main', fontSize: 14 }}>{playerError}</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<Grid
				container
				px={3}
				onClick={() => {
					setPlayerOverlayIsOpen((open) => !open);
				}}
				sx={{
					bgcolor: 'background.paper',
					height: 100,
					cursor: { xs: 'pointer', md: 'auto' },
					width: '100%',
					borderTop: '1px solid #292929'
				}}
			>
				<Grid
					item
					xs={12}
					md={3}
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'flex-start'
					}}
				>
					<Avatar
						src={current_track?.album.images[0].url}
						alt={'#'}
						variant="square"
						sx={{ width: 56, height: 56, marginRight: 2 }}
					/>
					<Box>
						<Typography sx={{ color: 'text.primary', fontSize: 14 }}>{current_track?.name}</Typography>
						<Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
							{current_track?.artists[0].name}
						</Typography>
					</Box>
				</Grid>
				<Grid
					item
					sx={{
						display: { xs: 'none', md: 'flex' },
						flex: 1,
						justifyContent: { xs: 'flex-end', md: 'center' },
						alignItems: 'center'
					}}
				>
					<PlayerControls
						progress={progress}
						is_paused={is_paused}
						duration={duration}
						player={localPlayer}
						isConnected={isConnected}
					/>
				</Grid>
				<PlayerVolume player={localPlayer} isConnected={isConnected} />
			</Grid>
			<PlayerOverlay
				progress={progress}
				is_paused={is_paused}
				duration={duration}
				player={localPlayer}
				playerOverlayIsOpen={playerOverlayIsOpen}
				closeOverlay={() => setPlayerOverlayIsOpen(false)}
				current_track={current_track}
				isConnected={isConnected}
			/>
		</Box>
	);
};

export default Player;