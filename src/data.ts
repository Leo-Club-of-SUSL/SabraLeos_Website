import type { SiteContent } from './types';

export const NAV_LINKS = [
    { name: 'Home', href: 'home' },
    { name: 'About', href: 'about' },
    { name: 'Projects', href: 'projects' },
    { name: 'Leadership', href: 'leadership' },
    { name: 'Gallery', href: 'gallery' },
    { name: 'Contact', href: 'contact' },
];

// Default site content (used as fallback when Supabase data hasn't loaded yet)
export const DEFAULT_SITE_CONTENT: SiteContent = {
    // Hero section
    hero_title: 'Leo Club of',
    hero_subtitle: 'Sabaragamuwa University of Sri Lanka',
    hero_cta: 'Join Us',
    hero_tagline: 'Empowering Youth, Serving Community',
    hero_bg_image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1920&auto=format&fit=crop',

    // About section
    about_mission: 'To provide the youth of the world with an opportunity for development and contribution, individually and collectively, as responsible members of the local, national, and international community.',
    about_vision: 'To be the global leader in community and humanitarian service.',
    about_history: 'Founded in [Year], our club has been serving the community for over [X] years, dedicating countless hours to service projects that uplift our society.',
    about_values: 'Leadership, Experience, Opportunity. We believe in serving our community with integrity, passion, and a commitment to making the world a better place.',

    // Contact section
    contact_email: 'leoclub@example.com',
    contact_phone: '+1 234 567 890',
    contact_address: '123 Leo Street, City Name',
    contact_facebook: '#',
    contact_instagram: '#',
    contact_whatsapp: '#',
    contact_linkedin: '#',

    // Footer section
    footer_club_name: 'Leo Club of [City Name]',
    footer_sponsor: 'Sponsored by Lions Club of [City Name]',
};
