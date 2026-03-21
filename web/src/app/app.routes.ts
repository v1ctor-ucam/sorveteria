import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		loadComponent: () => import('./pages/home-page.component').then((m) => m.HomePageComponent)
	},
	{
		path: 'admin',
		loadComponent: () =>
			import('./pages/admin-dashboard.component').then((m) => m.AdminDashboardComponent)
	},
	{
		path: 'cliente',
		loadComponent: () => import('./pages/customer-area.component').then((m) => m.CustomerAreaComponent)
	},
	{
		path: '**',
		redirectTo: ''
	}
];
