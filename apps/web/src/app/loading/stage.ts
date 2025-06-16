import { ClientDatabaseInitStage } from '@/database/client/types';

export enum AppLoadingStage {
	InitDB = 'initDB',
	InitBrowser = 'initBrowser',
	GoToApp = 'goToApp',
}

export const CLIENT_LOADING_STAGES = [
	AppLoadingStage.InitDB,
	ClientDatabaseInitStage.Idle,
	ClientDatabaseInitStage.Initializing,
	ClientDatabaseInitStage.LoadingDependencies,
	ClientDatabaseInitStage.LoadingWasm,
	ClientDatabaseInitStage.Migrating,
	ClientDatabaseInitStage.Finished,
	ClientDatabaseInitStage.Ready,
	AppLoadingStage.InitBrowser,
	AppLoadingStage.GoToApp,
];
