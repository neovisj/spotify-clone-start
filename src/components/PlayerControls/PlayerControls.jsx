import { PlayArrow, SkipNext, SkipPrevious, Pause } from '@mui/icons-material';
import { IconButton, Stack, Typography, Slider, Box } from '@mui/material';
import { formatTime } from '../../utils/formatTime';
import { useEffect, useState } from 'react';

const PlayerControls = ({ player, is_paused, duration, progress, isConnected }) => {
	const skipStyle = { width: 28, height: 28 };
	const [currentProgress, setCurrentProgress] = useState(progress);

	useEffect(() => {
		const interval = setInterval(() => {
			if (!is_paused && player && isConnected) {
				setCurrentProgress((c) => c + 1);
			}
		}, 1000);
		return () => clearInterval(interval);
	}, [is_paused, player, isConnected]);

	useEffect(() => {
		setCurrentProgress(progress);
	}, [progress]);

	const handlePlayerAction = async (action) => {
		if (!player || !isConnected) {
			console.error('Player not available or not connected');
			return;
		}

		try {
			await action();
		} catch (error) {
			console.error('Player action failed:', error);
			// You could show a toast notification here
		}
	};

	if (!player || !isConnected) return <Box>Connecting...</Box>;

	return (
		<Stack direction="column" spacing={2} justify="center" alignItems="center" sx={{ width: '100%' }}>
			<Stack spacing={1} direction="row" justifyContent={'center'} alignItems="center" sx={{ width: '100%' }}>
				<IconButton
					onClick={() => {
						setCurrentProgress(0);
						handlePlayerAction(() => player.previousTrack());
					}}
					size="small"
					sx={{ color: 'text.primary' }}
					disabled={!isConnected}
				>
					<SkipPrevious sx={skipStyle} />
				</IconButton>
				<IconButton
					onClick={() => {
						handlePlayerAction(() => player.togglePlay());
					}}
					size="small"
					sx={{ color: 'text.primary' }}
					disabled={!isConnected}
				>
					{is_paused ? (
						<PlayArrow sx={{ width: 38, height: 38 }} />
					) : (
						<Pause sx={{ width: 38, height: 38 }} />
					)}
				</IconButton>
				<IconButton
					onClick={() => {
						handlePlayerAction(() => player.nextTrack());
					}}
					size="small"
					sx={{ color: 'text.primary' }}
					disabled={!isConnected}
				>
					<SkipNext sx={skipStyle} />
				</IconButton>
			</Stack>
			<Stack spacing={2} direction="row" justifyContent={'center'} alignItems="center" sx={{ width: '75%' }}>
				<Typography variant="body1" sx={{ color: 'text.secondary', fontSize: 12 }}>
					{formatTime(currentProgress)}
				</Typography>
				<Slider
					max={duration}
					value={currentProgress}
					onChange={(_, value) => {
						setCurrentProgress(value);
					}}
					onChangeCommitted={(e, value) => {
						handlePlayerAction(() => player.seek(value * 1000));
					}}
					min={0}
					size="medium"
					disabled={!isConnected}
				/>
				<Typography variant="body1" sx={{ color: 'text.secondary', fontSize: 12 }}>
					{formatTime(duration)}
				</Typography>
			</Stack>
		</Stack>
	);
};

export default PlayerControls;