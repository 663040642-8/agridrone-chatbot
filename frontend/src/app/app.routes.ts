import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Verify } from './features/auth/verify/verify';
import { Chat } from './features/chat/chat';
import { Welcome } from './features/welcome/welcome';
import { MainLayout } from './layouts/main-layout/main-layout';
import { guestGuard } from './core/guards/guest-guard';

export const routes: Routes = [
    { path: 'login', component: Login, canActivate: [guestGuard] },
    { path: 'register', component: Register, canActivate: [guestGuard] },
    { path: 'verify', component: Verify },
    { path: 'home', component: Welcome },
    {
        path: '',
        component: MainLayout,
        children: [
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: 'chat', component: Chat },
        ]
    },
    { path: '**', redirectTo: 'home', pathMatch: 'full' }
];
