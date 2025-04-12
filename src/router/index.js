import {createRouter, createWebHashHistory} from 'vue-router'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('../components/WhiteListApplication.vue')
        },
        {
            path: '/whitelist-members',
            name: 'members',
            component: () => import('../components/WhiteListMember.vue')
        },
        {
            path: '/server-status',
            name: 'serverStatus',
            component: () => import('../components/ServerStatus.vue')
        },
        {
            path: '/player-servers/:gameId',
            name: 'playerServers',
            component: () => import('../components/PlayerServers.vue')
        },
        {
            path: '/404',
            name: 'NotFound',
            component: () => import('../views/NotFound.vue')
        },
        {
            path: '/quiz',
            name: 'quiz',
            component: () => import('../views/WhitelistQuiz.vue')
        },
        {
            path: '/verify',
            name: 'verify',
            component: () => import('../views/VerifyWhitelist.vue')
        },
        {
            path: '/:pathMatch(.*)*',
            redirect: '/404'
        }
    ]
})

export default router 