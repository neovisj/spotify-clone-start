import { useEffect, useState } from 'react';
import { Box, List, Typography } from '@mui/material';
import PlaylistItem from '../components/PlaylistItem/PlaylistItem';

const Library = ({ spotifyApi, token }) => {
	const [albumList, setAlbumList] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function getPlaylists() {
			if (!spotifyApi) return;

			try {
				const data = await spotifyApi.getUserPlaylists();
				setLoading(false);
				setAlbumList(data.body.items);
			} catch (error) {
				console.error('Library: Error getting playlists:', error);
				setLoading(false);
				setAlbumList([]);
			}
		}
		getPlaylists();
	}, [spotifyApi, token]);

	const renderPlaylistItems = () => {
		if (loading) {
			return [1, 2, 3, 4, 5, 6, 7].map((_, i) => <PlaylistItem key={i} loading={loading} />);
		}

		return albumList.map((playlist, i) => <PlaylistItem key={i} {...playlist} loading={loading} />);
	};

	return (
		<Box
			id="Library"
			px={3}
			sx={{
				display: { xs: 'flex', md: 'flex' },
				bgcolor: 'background.default',
				flex: 1,
				flexDirection: 'column',
				overflowY: 'auto'
			}}
		>
			<Typography py={3} variant="h2" fontWeight="bold" sx={{ color: 'text.primary', fontSize: 30 }}>
				Ditt bibliotek
			</Typography>
			<List>{renderPlaylistItems()}</List>
		</Box>
	);
};

export default Library;