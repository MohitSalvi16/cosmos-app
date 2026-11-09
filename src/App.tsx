import { lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '@/components/navigation/Layout';
import { SearchProvider } from '@/components/search/SearchContext';
import { MotionProvider } from '@/hooks/useMotionPreference';

// Route-level code splitting: each page (and the heavy 3D code it pulls in) loads on demand.
const HomePage = lazy(() => import('@/pages/HomePage'));
const ExplorePage = lazy(() => import('@/pages/ExplorePage'));
const PlanetsPage = lazy(() => import('@/pages/PlanetsPage'));
const PlanetDetailPage = lazy(() => import('@/pages/PlanetDetailPage'));
const ExoplanetsPage = lazy(() => import('@/pages/ExoplanetsPage'));
const ExoplanetDetailPage = lazy(() => import('@/pages/ExoplanetDetailPage'));
const GalaxiesPage = lazy(() => import('@/pages/GalaxiesPage'));
const GalaxyDetailPage = lazy(() => import('@/pages/GalaxyDetailPage'));
const StarsPage = lazy(() => import('@/pages/StarsPage'));
const StarDetailPage = lazy(() => import('@/pages/StarDetailPage'));
const BlackHolesPage = lazy(() => import('@/pages/BlackHolesPage'));
const AsteroidsPage = lazy(() => import('@/pages/AsteroidsPage'));
const GalleryPage = lazy(() => import('@/pages/GalleryPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function Root() {
  return (
    <SearchProvider>
      <Layout />
    </SearchProvider>
  );
}

export const routes = [
  {
    element: <Root />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/explore', element: <ExplorePage /> },
      { path: '/planets', element: <PlanetsPage /> },
      { path: '/planets/:id', element: <PlanetDetailPage /> },
      { path: '/exoplanets', element: <ExoplanetsPage /> },
      { path: '/exoplanets/:name', element: <ExoplanetDetailPage /> },
      { path: '/galaxies', element: <GalaxiesPage /> },
      { path: '/galaxies/:id', element: <GalaxyDetailPage /> },
      { path: '/stars', element: <StarsPage /> },
      { path: '/stars/:id', element: <StarDetailPage /> },
      { path: '/black-holes', element: <BlackHolesPage /> },
      { path: '/asteroids', element: <AsteroidsPage /> },
      { path: '/gallery', element: <GalleryPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

const router = createBrowserRouter(routes, {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

export function App() {
  return (
    <MotionProvider>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </MotionProvider>
  );
}
