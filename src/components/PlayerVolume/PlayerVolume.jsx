import { useState } from 'react';
import { VolumeDown, VolumeUp, VolumeOff } from '@mui/icons-material';
import { Grid, Stack, Slider } from '@mui/material';

const PlayerVolume = ({ player, isConnected }) => {
	const defaultVolume = 50;
	const [volume, setVolume] = useState(defaultVolume);

	const handleVolumeChange = async (v) => {
		if (!player || !isConnected) {
			console.error('Player not available or not connected for volume change');
			return;
		}

		try {
			await player.setVolume(v / 100);
		} catch (err) {
			console.error('Volume change failed:', err);
		}
	};

	return (
		<Grid
			item
			xs={3}
			sx={{
				display: { xs: 'none', md: 'flex' },
				alignItems: 'center',
				justifyContent: 'flex-end'
			}}
		>
			<Stack spacing={2} direction="row" alignItems="center" sx={{ width: 150, color: 'text.secondary' }}>
				{volume === 0 ? <VolumeOff /> : volume < 50 ? <VolumeDown /> : <VolumeUp />}
				<Slider
					min={0}
					max={100}
					step={1}
					value={volume}
					onChange={(e, v) => setVolume(v)}
					onChangeCommitted={async (_, value) => handleVolumeChange(value)}
					disabled={!isConnected}
				/>
			</Stack>
		</Grid>
	);
};

export default PlayerVolume;