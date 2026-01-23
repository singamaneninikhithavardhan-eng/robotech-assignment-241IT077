import { useEffect, useState } from "react";
import Navigation from "../components/Navbar";
import Footer from "../components/Footer";
import ProjectCard from "../components/ProjectCard";
import ProjectModal from "../components/ProjectModal";
import GalleryMarquee from "../components/GalleryMarquee";
import GalleryModal from "../components/GalleryModal";
import api from "../api/axios";

export default function LandingPage() {
  const [projects, setProjects] = useState([]);
  const [gallery, setGallery] = useState([]);

  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  /* ================= LOAD DATA ================= */
  /* ================= LOAD DATA ================= */
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [projRes, galRes] = await Promise.all([
          api.get("/projects"),
          api.get("/gallery")
        ]);

        if (isMounted) {
          setProjects(projRes.data);
          setGallery(galRes.data);
        }
      } catch (err) {
        console.error("Landing page load error:", err);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      {/* ================= SPLASH ================= */}
      {showSplash && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
          <img
            src="/robotech_nitk_logo.jpeg"
            alt="RoboTech Logo"
            className="w-64 h-64 rounded-full animate-logoBoot"
          />
        </div>
      )}

      <Navigation />

      {/* ================= CONTINUOUS BACKGROUND VIDEO ================= */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover -z-10"
      >
        <source src="/landingBg2.mp4" type="video/mp4" />
      </video>


      {/* ================= HERO ================= */}
      <section className="relative h-screen w-full overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/landingBg1.mp4" type="video/mp4" />
        </video>



        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center px-6">
          <h1 className="text-5xl md:text-7xl font-[Orbitron] font-bold text-cyan-400 tracking-wider drop-shadow-[0_0_25px_#00fff2]">
            ROBOTECH CLUB
          </h1>

          <p className="text-gray-300 text-lg md:text-xl mt-6 max-w-2xl">
            A community of innovators, engineers, and creators — building
            intelligent machines to shape tomorrow.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="/contactUs"
              className="bg-cyan-500 hover:bg-cyan-600 px-8 py-3 rounded-md font-semibold transition transform hover:scale-105"
            >
              Join Now
            </a>
            <a
              href="#projects"
              className="bg-gray-800 hover:bg-gray-700 px-8 py-3 rounded-md font-semibold transition transform hover:scale-105"
            >
              Explore Projects
            </a>
          </div>

          <div className="flex gap-8 mt-12 text-3xl text-cyan-400 animate-pulse">
            <i className="fa-solid fa-robot"></i>
            <i className="fa-solid fa-microchip"></i>
            <i className="fa-solid fa-gears"></i>
            <i className="fa-solid fa-brain"></i>
          </div>
        </div>
      </section>

      {/* ================= ABOUT US (RESTORED, UNCHANGED) ================= */}
      <section className="py-24 text-center px-6">
        <h2 className="text-4xl font-[Orbitron] text-cyan-400 mb-6">
          About Us
        </h2>
        <p className="max-w-3xl mx-auto text-gray-300 text-lg leading-relaxed">
          At RoboTech NITK, we bridge creativity and engineering through robotics,
          AI, and automation. Our club hosts workshops, participates in
          competitions, and mentors students to explore the world of technology.
        </p>
      </section>

      {/* ================= OUR VISION (RESTORED, UNCHANGED) ================= */}
      <section className="py-24 text-center px-6">
        <h2 className="text-4xl font-[Orbitron] text-cyan-400 mb-6">
          Our Vision
        </h2>
        <p className="max-w-3xl mx-auto text-gray-300 text-lg leading-relaxed">
          Our vision is to cultivate a culture of innovation at NITK where
          students explore robotics and AI to solve real-world challenges.
          <br />
          <br />
          We envision a club that not only builds robots, but builds thinkers,
          leaders, and innovators.
        </p>
      </section>

      {/* ================= PROJECTS ================= */}
      <section id="projects" className="py-20">
        <h2 className="text-4xl text-center font-[Orbitron] text-cyan-400 mb-12">
          Our Projects
        </h2>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onOpen={() => setActiveProjectId(p.id)}
            />
          ))}
        </div>
      </section>

      {activeProjectId && (
        <ProjectModal
          projectId={activeProjectId}
          onClose={() => setActiveProjectId(null)}
        />
      )}

      {/* ================= GALLERY ================= */}
      <section className="py-20">
        <h2 className="text-4xl font-[Orbitron] text-cyan-400 text-center mb-12">
          Gallery
        </h2>

        <GalleryMarquee
          images={gallery}
          onOpen={(img) => setActiveImage(img)}
        />
      </section>

      {activeImage && (
        <GalleryModal
          image={activeImage}
          onClose={() => setActiveImage(null)}
        />
      )}

      <Footer />
    </>
  );
}
