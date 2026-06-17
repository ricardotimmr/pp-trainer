import blurredRunnerImage from '../assets/home/arnaud-steckle-NUkrKjQXRgE-unsplash.jpg';
import bikeTimeTrialImage from '../assets/home/diana-rafira-jth6_VDCOIo-unsplash.jpg';
import homeHeroPicture from '../assets/home/home-hero-picture.png';
import trackCloseupImage from '../assets/home/jakub-balon-MP38AUvIilY-unsplash.jpg';
import swimPackImage from '../assets/home/jon-del-rivero-AjF5fv4-a2U-unsplash.jpg';
import openWaterImage from '../assets/home/markus-spiske-XcvocqxlQ-A-unsplash.jpg';
import cyclistsImage from '../assets/home/markus-spiske-sjsKbYmPaeM-unsplash.jpg';
import triRunImage from '../assets/home/nodir-khalilov-uTTU2FLf-I0-unsplash.jpg';
import monochromeRunImage from '../assets/home/r_-invscimento-pFYI404z_a4-unsplash.jpg';
import trackCurveImage from '../assets/home/zhivko-minkov-2nUwx5QSJ84-unsplash.jpg';
import type { PageComponentProps } from '../routes/routeTypes';

const floatingTiles = [
  {
    className: 'home-portfolio__tile--one',
    label: 'Tempo set',
    image: trackCloseupImage,
  },
  {
    className: 'home-portfolio__tile--two',
    label: 'Race prep',
    image: bikeTimeTrialImage,
  },
  {
    className: 'home-portfolio__tile--three',
    label: 'Bike block',
    image: cyclistsImage,
  },
  {
    className: 'home-portfolio__tile--four',
    label: 'Recovery',
    image: blurredRunnerImage,
  },
  {
    className: 'home-portfolio__tile--five',
    label: 'Swim focus',
    image: openWaterImage,
  },
  {
    className: 'home-portfolio__tile--six',
    label: 'Long run',
    image: triRunImage,
  },
  {
    className: 'home-portfolio__tile--seven',
    label: 'Fueling',
    image: swimPackImage,
  },
  {
    className: 'home-portfolio__tile--eight',
    label: 'Strength',
    image: trackCurveImage,
  },
  {
    className: 'home-portfolio__tile--nine',
    label: 'Travel week',
    image: monochromeRunImage,
  },
  {
    className: 'home-portfolio__tile--ten',
    label: 'Race day',
    image: bikeTimeTrialImage,
  },
  {
    className: 'home-portfolio__tile--eleven',
    label: 'Mobility',
    image: trackCloseupImage,
  },
  {
    className: 'home-portfolio__tile--twelve',
    label: 'Threshold',
    image: cyclistsImage,
  },
];

const newsItems = [
  {
    title: 'Planned week rebuilt around travel, recovery and key intervals',
    meta: 'Training Log',
    image: trackCloseupImage,
  },
  {
    title: 'Coach note flags durability work before the next race block',
    meta: 'AI Coach',
    image: openWaterImage,
  },
  {
    title: 'Source import keeps indoor rides and race files in one view',
    meta: 'Data Sync',
    image: cyclistsImage,
  },
];

export function HomePage({ navigate }: PageComponentProps) {
  return (
    <div className="home-page">
      <section className="home-hero" aria-label="Precision Pacers">
        <img
          className="home-hero__image"
          src={homeHeroPicture}
          alt="Runners racing through a city course"
        />
        <div className="home-hero__shade" aria-hidden="true" />
        <div className="home-hero__content">
          <p className="home-hero__eyebrow">Precision Pacers</p>
          <h1>
            Make.
            <br />
            Every Day.
            <br />
            Faster.
          </h1>
        </div>
        <button
          type="button"
          className="home-hero__card"
          onClick={() => navigate('/dashboard')}
        >
          <span className="home-hero__card-media" aria-hidden="true">
            <img src={trackCloseupImage} alt="" />
          </span>
          <span>
            <small>Current block</small>
            <strong>Dashboard</strong>
          </span>
        </button>
      </section>

      <section className="home-intro" aria-label="Product introduction">
        <div className="home-intro__copy">
          <h2>
            We design sharp training views, build concise plans, and shape
            performance data into a place to train from.
          </h2>
          <p>
            Precision Pacers turns your week, workouts, activity history and
            coach notes into one focused prototype experience.
          </p>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => navigate('/training-plan')}
          >
            Learn more
          </button>
        </div>
      </section>

      <section className="home-portfolio" aria-label="Training portfolio">
        {floatingTiles.map((tile, index) => (
          <div
            key={tile.label}
            className={`home-portfolio__tile ${tile.className}`}
            aria-hidden="true"
          >
            <img src={tile.image} alt="" />
            <span>{String(index + 1).padStart(2, '0')}</span>
          </div>
        ))}
        <div className="home-portfolio__headline">
          <h2>
            A training hub
            <br />
            built for every
            <br />
            step.
          </h2>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => navigate('/activities')}
          >
            Explore activities
          </button>
        </div>
      </section>

      <section className="home-report" aria-label="Annual report">
        <div className="home-report__image" aria-hidden="true">
          <img src={triRunImage} alt="" />
          <span />
        </div>
        <div className="home-report__panel">
          <h2>
            2026
            <br />
            Training Report
          </h2>
          <p>
            One view for weekly volume, completed work, upcoming sessions and
            the details that make the next decision easier.
          </p>
          <button
            type="button"
            className="button button--primary"
            onClick={() => navigate('/dashboard')}
          >
            Read the report
          </button>
        </div>
      </section>

      <section className="home-beliefs" aria-label="Training philosophy">
        <h2>
          Many sources,
          <br />
          one shared culture,
          <br />
          limitless progression.
        </h2>
        <div>
          <p>
            Our product language favors direct comparison, fast scanning and
            repeat use. Across plans, activities, imports and AI notes,
            Precision Pacers is built to keep athletes oriented.
          </p>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => navigate('/ai-coach')}
          >
            Explore coach preview
          </button>
        </div>
      </section>

      <section className="home-market" aria-label="Training snapshot">
        <div className="home-section-head">
          <h2>Market Snapshot</h2>
          <span>Prototype data</span>
        </div>
        <div className="home-market__value">
          <strong>17.63</strong>
          <span>hrs planned</span>
        </div>
        <dl className="home-market__metrics">
          <div>
            <dt>Easy</dt>
            <dd>8:15 h</dd>
          </div>
          <div>
            <dt>Quality</dt>
            <dd>3:40 h</dd>
          </div>
          <div>
            <dt>Strength</dt>
            <dd>2:00 h</dd>
          </div>
          <div>
            <dt>Last update</dt>
            <dd>This week</dd>
          </div>
        </dl>
      </section>

      <section className="home-news" aria-label="Latest news">
        <div className="home-section-head">
          <h2>Latest News</h2>
          <button type="button" onClick={() => navigate('/activities')}>
            View all
          </button>
        </div>
        <div className="home-news__grid">
          {newsItems.map((item, index) => (
            <article key={item.title} className="home-news-card">
              <div
                className={`home-news-card__media home-news-card__media--${index + 1}`}
                aria-hidden="true"
              >
                <img src={item.image} alt="" />
              </div>
              <p>{item.meta}</p>
              <h3>{item.title}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="home-cta" aria-label="Start training">
        <img className="home-cta__image" src={monochromeRunImage} alt="" />
        <div className="home-cta__shade" aria-hidden="true" />
        <h2>
          Creating
          <br />
          Your Future
          <br />
          With Us
        </h2>
        <p>
          No matter the day, the point is clear: show up with structure,
          understand the load, and make the next session count.
        </p>
        <button
          type="button"
          className="button button--primary"
          onClick={() => navigate('/training-plan')}
        >
          Start planning
        </button>
      </section>
    </div>
  );
}
