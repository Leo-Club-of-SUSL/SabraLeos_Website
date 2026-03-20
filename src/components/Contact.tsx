import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Mail, Phone, MapPin, Facebook, Instagram, MessageCircle, Linkedin } from 'lucide-react';

const Contact = () => {
  const { siteContent } = useData();

  return (
    <section id="contact" className="py-20 bg-[var(--color-leo-maroon)] text-white">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6">Get in Touch</h2>
            <p className="text-red-100 mb-10 text-lg">
              Interested in joining or have a question? We'd love to hear from you.
            </p>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="bg-[var(--color-leo-gold)] p-3 rounded-full text-[var(--color-leo-maroon)]">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="font-bold">Email Us</h4>
                  <p className="text-red-100">{siteContent.contact_email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-[var(--color-leo-gold)] p-3 rounded-full text-[var(--color-leo-maroon)]">
                  <Phone size={24} />
                </div>
                <div>
                  <h4 className="font-bold">Call Us</h4>
                  <p className="text-red-100">{siteContent.contact_phone}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-[var(--color-leo-gold)] p-3 rounded-full text-[var(--color-leo-maroon)]">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold">Visit Us</h4>
                  <p className="text-red-100">{siteContent.contact_address}</p>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <h4 className="font-bold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href={siteContent.contact_facebook} target="_blank" rel="noopener noreferrer" aria-label="Visit our Facebook page" className="bg-white/10 p-3 rounded-full hover:bg-[var(--color-leo-gold)] hover:text-[var(--color-leo-maroon)] transition-colors">
                  <Facebook size={24} />
                </a>
                <a href={siteContent.contact_instagram} target="_blank" rel="noopener noreferrer" aria-label="Visit our Instagram profile" className="bg-white/10 p-3 rounded-full hover:bg-[var(--color-leo-gold)] hover:text-[var(--color-leo-maroon)] transition-colors">
                  <Instagram size={24} />
                </a>
                <a href={siteContent.contact_whatsapp || '#'} target="_blank" rel="noopener noreferrer" aria-label="Contact us on WhatsApp" className="bg-white/10 p-3 rounded-full hover:bg-[var(--color-leo-gold)] hover:text-[var(--color-leo-maroon)] transition-colors">
                  <MessageCircle size={24} />
                </a>
                <a href={siteContent.contact_linkedin || '#'} target="_blank" rel="noopener noreferrer" aria-label="Connect with us on LinkedIn" className="bg-white/10 p-3 rounded-full hover:bg-[var(--color-leo-gold)] hover:text-[var(--color-leo-maroon)] transition-colors">
                  <Linkedin size={24} />
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl"
          >
            <form className="space-y-6">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-[var(--color-leo-maroon)] focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900 outline-none transition-all"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-[var(--color-leo-maroon)] focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900 outline-none transition-all"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Message</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-[var(--color-leo-maroon)] focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900 outline-none transition-all"
                  placeholder="How can we help you?"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-[var(--color-leo-gold)] text-[var(--color-leo-maroon)] font-bold py-4 rounded-lg hover:bg-[#eec136] transition-colors shadow-lg cursor-pointer"
              >
                Send Message
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
