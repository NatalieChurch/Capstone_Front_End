import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';


const slides = [
  {
    id: 1,
    title: 'Welcome',
    subtitle: 'Ready To Play Blackjack?',
    background: '/Lime_and_Dark_Green_Gradient.jpg',
    button: 'Start Playing',
    link: '/game',
  },
  {
    id: 2,
    title: 'Join Us!',
    subtitle: 'Register Or Login',
    background: '/Lime_and_Dark_Green_Gradient.jpg',
    button: 'Register',
    link: '/register',
  },
  {
    id: 3,
    title: 'Basic Rules',
    subtitle: '',
    background: '/Lime_and_Dark_Green_Gradient.jpg',
    content: ["In Blackjack, the goal is to get a hand value as close to 21 as possible without exceeding 21, while also having a higher hand than the dealer's."],
    list: [
        "1. Place your bet.",
        "2. The dealer deals the cards.",
        "3. Add up the value of the cards in your hand, and decide to hit or stand.",
        "4. The dealer reveals their hand.",
        "5. Determine the winner."
    ],
    button: 'Ready To Try It Yourself?',
    link: '/game',
  },
  {
    id: 4,
    title: "Blackjack?",
    subtitle: '',
    background: '/Lime_and_Dark_Green_Gradient.jpg',
    content:
      ["If a player's first two cards are an ace and a 10-value card, it's a blackjack and the player wins immediately. The only exception to this rule is if the dealer also hs a blackjack. If this happens the round ends in a tie and all bets are returned."],
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
    }, 5000);
    return () => clearInterval(timer);
  }, [visibleSlides.length]);

  useEffect(() => {
    if (currentSlide >= visibleSlides.length) {
      setCurrentSlide(0);
    }
  }, [currentSlide, visibleSlides.length]);


   return (
    <section id="section-1">
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
                <span>{`0${index + 1}`}</span> {slide.title}
              </label>
            ))}
          </div>
        </nav>
      </div>
    </section>
  );
}
