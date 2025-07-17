import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';


const slides = [
  {
    id: 1,
    barTitle: "Welcome",
    title: 'Welcome to Blackjack Academy',
    subtitle: 'Ready To Learn?',
    background: '/Lime_and_Dark_Green_Gradient.jpg',
    button: 'Start Playing',
    link: '/game',
  },
  {
    id: 2,
    barTitle: "Register",
    title: 'Join Us to Start Learning!',
    subtitle: 'Create an Account',
    background: '/Lime_and_Dark_Green_Gradient.jpg',
    content: [],
    button: 'Register',
    link: '/register',
  },
  {
    id: 3,
    barTitle: "Get Practice",
    title: "Don't embarrass yourself at the table",
    subtitle: '',
    background: '/Lime_and_Dark_Green_Gradient.jpg',
    content: ["New to blackjack? Have an upcoming trip to Vegas planned? Don't look like an amateur at the casino! With Blackjack Academy you can practice with no-stakes single-deck blackjack and get tips on what to do as you play! "],
    button: 'Try It Yourself!',
    link: '/game',
  },
  {
    id: 4,
    barTitle: "Learn Strategy",
    title: "Basic Strategy",
    subtitle: '',
    background: '/Lime_and_Dark_Green_Gradient.jpg',
    content:
      ["Blackjack Academy teaches you basic strategy, which is a mathematically proven system for playing blackjack that minimizes the house edge by telling you the statistically best move for every possible hand: hit, stand, split, or double down."],
  },
];

export default function Slider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const visibleSlides = slides.filter(
    slide => !(slide.title === "Join Us!" && token)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % visibleSlides.length);
    }, 20000);
    return () => clearInterval(timer);
  }, [visibleSlides.length]);

  useEffect(() => {
    if (currentSlide >= visibleSlides.length) {
      setCurrentSlide(0);
    }
  }, [currentSlide, visibleSlides.length]);


   return (
    <section id="slidesAndProgressBar">
      <div className="content-slider">
        <div className="slider">
          {visibleSlides.map((slide, index) => (
            <div
                key={slide.id}
                className={`banner ${index === currentSlide ? 'active' : ''}`}
                id={`top-banner-${slide.id}`}
                style={{
                    backgroundImage: `url(${slide.background})`,
                }}
            >
              <div className="banner-inner-wrapper">
                <h2>{slide.title}</h2>

                {slide.subtitle && (
                  <h1>
                    {slide.subtitle.split('\n').map((line, i) => (
                      <span key={i}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </h1>
                )}

                {slide.content &&
                  (Array.isArray(slide.content) ? (
                    slide.content.map((p, i) => <p key={i}>{p}</p>)
                  ) : (
                    <p>{slide.content}</p>
                  ))}

                {slide.list && (
                  <ol>
                    {slide.list.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                )}

                <div className="line" />

                {slide.button && slide.link && (slide.title !== "Join Us!" || !token) && (
                  <div className="homepage-button">
                      <button onClick={() => navigate(slide.link)}>
                        {slide.button}
                      </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <nav>
          <div className="controls">
            {visibleSlides.map((slide, index) => (
              <label key={slide.id} onClick={() => setCurrentSlide(index)}>
                <span className="progressbar">
                  <span
                    className="progressbar-fill"
                    style={{
                      animation:
                        index === currentSlide
                          ? 'progressBarFill 5s linear forwards'
                          : 'none',
                    }}
                  ></span>
                </span>
                <span>{`0${index + 1}`}</span> {slide.barTitle}
              </label>
            ))}
          </div>
        </nav>
      </div>
    </section>
  );
}
