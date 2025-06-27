import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import Home from '../../pages/Home';
import SideNav from '../SideNav/SideNav';
import { getAccessTokenFromStorage } from '../../utils/getAccessTokenFromStorage';
import Playlist from '../../pages/Playlist';
import Player from '../Player/Player';
import MobileNav from '../MobileNav/MobileNav';
import Library from '../../pages/Library';
import { Outlet } from 'react-router-dom';

const Dashboard = ({ spotifyApi }) => {
	const [token, setToken] = useState(getAccessTokenFromStorage());
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const onMount = async () => {
			if (token) {
				await spotifyApi.setAccessToken(token);
				setIsLoading(false);
			} else {
				setIsLoading(false);
			}
		};

		onMount();
	}, [token, spotifyApi]);

	return (
		<Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
			{!isLoading && (
				<Box sx={{ flex: 1, overflowY: 'auto', display: 'flex' }}>
					<SideNav spotifyApi={spotifyApi} token={token} />
					<Outlet /> {/* 👈 Nested route components render here */}
				</Box>
			)}
			{token && !isLoading && <Player spotifyApi={spotifyApi} />}
			<MobileNav />
		</Box>
	);
};

export default Dashboard;