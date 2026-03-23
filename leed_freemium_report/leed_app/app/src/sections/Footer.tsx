import { Building2, Mail, Linkedin, ExternalLink } from 'lucide-react';

const quickLinks = [
  { label: 'Analysis', href: '#analysis' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
];

const resources = [
  { label: 'Oman Building Code', href: 'https://mohup.gov.om/en/open-data/building-code' },
  { label: 'LEED Guidelines', href: 'https://www.usgbc.org/leed' },
  { label: 'NASA POWER', href: 'https://power.larc.nasa.gov/' },
  { label: 'ISRIC SoilGrids', href: 'https://www.isric.org/explore/soilgrids' },
];

export function Footer() {
  return (
    <footer className="bg-[#0f172a] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1a5d3c] to-[#d4af37] flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-lg">UrbanEX</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md mb-6">
              Comprehensive land sustainability assessment platform using NASA climate data, 
              ISRIC soil analysis, and LEED certification standards aligned with Oman Building Code 
              and Vision 2040.
            </p>
            
            {/* Developer Attribution */}
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a5d3c] to-[#d4af37] flex items-center justify-center">
                <span className="text-white font-bold text-sm">TA</span>
              </div>
              <div>
                <div className="text-white/60 text-xs">Developed by</div>
                <a 
                  href="https://www.linkedin.com/in/tariq-alamri" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white font-semibold flex items-center gap-2 hover:text-[#d4af37] transition-colors"
                >
                  Dr. Tariq Al Amri
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-2">
              {resources.map((resource, index) => (
                <li key={index}>
                  <a 
                    href={resource.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1"
                  >
                    {resource.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              © 2025 UrbanEX.om - Supporting Oman Vision 2040
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="mailto:info@urbanex.om" 
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <Mail className="w-4 h-4" />
                info@urbanex.om
              </a>
              <span className="w-2 h-2 rounded-full bg-[#1a5d3c]" />
              <span className="text-slate-500 text-sm">
                Aligned with Oman Energy Efficiency & Sustainability Code
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
