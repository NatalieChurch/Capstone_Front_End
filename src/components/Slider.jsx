import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

// There are 4 slides, each corresponding in order to the sliding banners on the Home page. Imported into the Home component so it shows up there.
const slides = [
  {
    // id 1 is the first slide, etc.
    id: 1,
    // barTitle is the word underneath the progress bar, describes the slide it's attached to
    barTitle: "Welcome",
    // What you see in cursive on the sliding banner
    title: 'Welcome to Blackjack Academy',
    // What you see in bold in the sliding banner
    subtitle: 'Ready To Learn?',
    // Background image (green gradient)
    background: '/Lime_and_Dark_Green_Gradient.jpg',
    // Text for button on banner (if there is one)
    button: 'Start Playing',
    // Route the button redirects to when clicked
    link: '/game',
  },
  {
    id: 2,
    barTitle: "Register",
    title: 'Join Us to Start Learning!',
    subtitle: 'Create an Account',
    background: '/Lime_and_Dark_Green_Gradient.jpg',
    // Content refers to the paragraph on the sliding banner. In this slide it's empty (no paragraph), in slide 03 and 04 it has text
    content: [],
    button: 'Register',
    link: '/register',
  },
  {
    id: 3,
    barTitle: "Practice",
    title: "Don't embarrass yourself at the table",
    // An empty subtitle like this means that there is no subtitle on the slide itself, so no bold letters
    subtitle: '',
    background: '/Lime_and_Dark_Green_Gradient.jpg',
    content: ["New to blackjack? Have an upcoming trip to Vegas planned? Don't look like an amateur at the casino! With Blackjack Academy you can practice with no-stakes single-deck blackjack and get tips on what to do as you play! "],
    button: 'Try It Yourself!',
    link: '/game',
  },
  {
    id: 4,
    barTitle: "Strategy",
    title: "Basic Strategy",
    subtitle: '',
    background: '/Lime_and_Dark_Green_Gradient.jpg',
    content:
      ["Blackjack Academy teaches you basic strategy, which is a mathematically proven system for playing blackjack that minimizes the house edge by telling you the statistically best move for every possible hand: hit, stand, split, or double down."],
  },
];

// Exports Slider component, imported in Home component
export default function Slider() {
  // currentSlide variable
  const [currentSlide, setCurrentSlide] = useState(0);
  // useNavigate is used to direct the user to a different route when a button is clicked
  const navigate = useNavigate();
  // Gets the token from local storage to check if a user is logged in 
  const token = localStorage.getItem('token');

  // If user is currently logged in, the Join Us slide (slide 02) should have a button that redirects to the game rather than the Register component
  const visibleSlides = slides.filter(
    slide => !(slide.title === "Join Us!" && token)
  );

  // This useEffect sets a timer so the current visible slide is automatically changed to the next slide every 15 seconds (that's what 15000 relates to)
  // Returns back to the beginning after all slides have been progressed through 
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % visibleSlides.length);
    }, 15000);
    return () => clearInterval(timer);
  }, [visibleSlides.length]);

  // This useEffect resets the current slide if necessary
  useEffect(() => {
    if (currentSlide >= visibleSlides.length) {
      setCurrentSlide(0);
    }
  }, [currentSlide, visibleSlides.length]);


   return (
    <section id="slidesAndProgressBar">
      <div className="content-slider">
        <div className="slider">

          {/* Runs through the visible slides and adds a class of "active" to the current slide */}
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
                {/* Title of the slide (cursive) */}
                <h2>{slide.title}</h2>

                {/* Subtitle of the slide (if applicable, shows as bold letters) */}
                {slide.subtitle && (
                  <h1>
                    {/* Properly formats subtitle to split and have spans and breaks for clarity/styling */}
                    {slide.subtitle.split('\n').map((line, i) => (
                      <span key={i}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </h1>
                )}

                {/* If there is slide content stored as an array, this can render it as multiple paragraphs. If it's a string, it will also be stored as a paragraph, but just one. */}
                {slide.content &&
                  (Array.isArray(slide.content) ? (
                    slide.content.map((p, i) => <p key={i}>{p}</p>)
                  ) : (
                    <p>{slide.content}</p>
                  ))}

                {/* Makes an ordered list if if a list exists on the sliding banner (was more applicable when one sliding banner listed basic rules). */}
                {slide.list && (
                  <ol>
                    {slide.list.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                )}

                {/* Horizontal line between content/lists and button. Even if one or neither exist, it will show up underneath where content and lists would have been, and above where the button would have been. */}
                <div className="line" />

                {/* If there's a button, this renders it. Navigates to the route that's slide.link */}
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
            {/* Renders nav bar with buttons that, when clicked, make the current slide the slide that corresponds to the button clicked. */}
            {visibleSlides.map((slide, index) => (
              <label key={slide.id} onClick={() => setCurrentSlide(index)}>
                {/* Shows progress bar, which slowly fills up with red over 15 seconds, but only for the progress bar that corresponds to the current slide. */}
                <span className="progressbar">
                  <span
                    className="progressbar-fill"
                    style={{
                      animation:
                        index === currentSlide
                          ? 'progressBarFill 15s linear forwards'
                          : 'none',
                    }}
                  ></span>
                </span>
                {/* Shows slide number and barTitle on the nav bar underneath the progressing bars. */}
                <span>{`0${index + 1}`}</span> {slide.barTitle}
              </label>
            ))}
          </div>
        </nav>
      </div>
    </section>
  );
}
