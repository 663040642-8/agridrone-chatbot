import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Verify } from './features/auth/verify/verify';
import { Chat } from './features/chat/chat';
import { Welcome } from './features/welcome/welcome'; 
import { MainLayout } from './layouts/main-layout/main-layout';

export const routes: Routes = [
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: 'verify', component: Verify },
    { path: 'home', component: Welcome },
    {
        path: '',
        component: MainLayout,
        children: [
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            {
                path: 'chat',
                component: Chat
            },
        ]
    },
];