import React, {Component} from 'react';
import './App.css';

const FetchError = () => {
  return (
    <div>Error connecting to the API</div>
  );
}

const Header = () => {
  return (
    <div>
      <h1>STAR FOLKS</h1>
      <h3>Click on someone to see more</h3>
    </div>
  );
}

const Person = ({name, url, selected, onClickHandler}) => {
  return (
    <div className={"character " + (selected ? "character-selected" : "")} onClick={() => onClickHandler(name, url)}>
      {name}
    </div>
  );
}

const People = ({people, selected, onSelectCharacter}) => {
  if (people.results) {
    return (
      <div>
        {people.results.map((character) => (
          <Person key={character.name} name={character.name} url={character.url} selected={character.name === selected ? true : false} onClickHandler={onSelectCharacter} />
        ))}
      </div>
    )
  } else return null;
};

function PaginatorButton(props) {
  return (
    <button className={"button-paginator " + (props.current ? "button-current" : "")} onClick={() => props.onChangePage(props.url, props.label)}> 
      {props.label} 
    </button>
  );  
}

class Paginator extends Component {

  handleSelectCharacter = (name, url) => {
    this.props.onSelectCharacter(name, url);
  }

  render() {
    const data = this.props.people;
    const character = this.props.characterSelected;
    const total_characters = data.count;
    const n_pages = Math.ceil(total_characters / 10);

    const previous = data.previous ? <PaginatorButton url={data.previous} label="<" onChangePage={(url, page) => this.props.onChangePage(url, page)} /> : "";
    const next = data.next ? <PaginatorButton url={data.next} label=">" onChangePage={(url, page) => this.props.onChangePage(url, page)} /> : "";
    const pages = [];

    for (var i=1; i<n_pages+1; i++) {
      const url = "http://swapi.dev/api/people/?page=" + i;
      const current = this.props.current_page === i ? true : false;

      pages.push(<PaginatorButton key={i} current={current} url={url} label={i} onChangePage={(url, page) => this.props.onChangePage(url, page)} />);
    }

    const content = this.props.loading ? <div className="loader"/> : <People people={data} selected={character} onSelectCharacter={this.handleSelectCharacter} />;

    return (
      <div className="paginator">
        {content}
        
        <div className="paginator-buttons">
          {previous}
          {pages}
          {next}
        </div>
      </div>
    );
  }
}

const CloseButton = ({onClickHandler}) => {
  return (
    <div className={"button-close"} onClick={onClickHandler}>
      Close
    </div>
  );
}

const CharacterHeader = ({name, height, mass}) => {
  const mass_str = mass === "unknown" ? "unknown weight" : mass + "kg"
  const height_str = height === "unknown" ? "unknown height" : height + "cm"

  return (
    <div className="character-header">
      {name}
      <div>
        {height_str}, {mass_str}
      </div>
    </div>
  );
}

const FilmButton = ({title, url, onClickHandler}) => {
  return (
    <button className="button-film" onClick={() => onClickHandler(url)}>{title}</button>
  );
}

const FilmBody = ({data}) => {
  return (
    <div>
      <h1>{data.title}</h1>
      <h3>dir. {data.director}</h3>
    
      <div className="film-description">
        {data.description}
      </div>
    </div>
  );
}

const CharacterBody = ({data, films, onFilmClick}) => {
  const film_buttons = data.films.map((film) => {
    let title = films[film] ? films[film].title : "?";
    return (
      <FilmButton key={film} title={title} url={film} onClickHandler={onFilmClick} />
    );
  });

  return (
    <div className="character-body">
      <div>
        <p>Birth Year</p> {data.birth_year}
        <p>Skin</p> {data.skin_color}
        <p>Hair</p> {data.hair_color}
        <p>Eyes</p> {data.eye_color}
      </div>

      <div>
        <p>Films</p> {film_buttons}
      </div>
    </div>
  );
}

class Character extends Component {
  constructor(props) {
    super(props);
    this.state = {
      character: null,
      active_film: null,
      films: [],
      loading: false
    }
  }

  componentDidMount() {
    this.setState({
      loading: true
    })
    fetch(this.props.url)
      .then(res => res.json())
      .then((data) => {
        this.setState({
          character: data,
          loading: false
        })
      })
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevProps.url !== this.props.url) {
      this.setState({
        loading: true
      })
      fetch(this.props.url)
        .then(res => res.json())
        .then((data) => {
          this.setState({
            character: data,
            loading: false,
            active_film: null
          })
        })
    }
  }

  handleCloseFilm = () => {
    this.setState({
      active_film: null
    })
  }

  handleClickFilm = (url) => {
    let films = this.state.films;
    let film_is_cached = false;

    for (var f in films) {
      if (f === url) {
        film_is_cached = true;
        break;
      }
    }

    if (film_is_cached) {
      this.setState({
        active_film: url
      });
    } 
    else {
      this.setState({
        loading: true
      })
      fetch(url)
        .then(res => res.json())
        .then((data) => {
          const info = {"title": data.title, "description": data.opening_crawl, "director": data.director}
          films[url] = info;

          this.setState({
            films: films,
            active_film: url,
            loading: false
          })
        })
    }
  }

  render() {
    if (this.state.loading) {
      return (
        <div className="more"> 
          <div className="loader"/>
        </div>
      );
    }

    const character = this.state.character;
    const active_film = this.state.active_film;
    const films = this.state.films;
    let body = null;

    if (active_film) {
      body = <div>
        <button className="button-back" onClick={this.handleCloseFilm}>Back to character</button>
        <FilmBody data={films[active_film]} />
        </div>;
    }
    else 
      body = <CharacterBody data={character} films={films} onFilmClick={this.handleClickFilm} />;

    if (character) {
      return (
        <div className="more"> 
          <CharacterHeader name={character.name} height={character.height} mass={character.mass} />
          {body}

          <CloseButton onClickHandler={this.props.onClose} />
        </div>
      );
    }
    else return null;
  }

}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
        people: [],
        selected: [null, null],
        loading: true,
        fetch_error: null,
        current_page: null
    }
  }
  
  componentDidMount() {
    fetch('http://swapi.dev/api/people/')
      .then(res => res.json())
      .then((data) => {
        this.setState({ 
          people: data,
          loading: false,
          current_page: 1
        })
      })
      .catch(function(error) {
        this.setState({
          fetch_error: true
        });
      })
  }

  handleChangePage = (url, page) => {
    this.setState({
      loading: true
    });

    const page_number = page === "<" ? this.state.current_page-1 : page === ">" ? this.state.current_page+1 : page;

    fetch(url)
      .then(res => res.json())
      .then((data) => {
        this.setState({ 
          people: data,
          loading: false,
          current_page: page_number
        })
      })
      .catch(function(error) {
        this.setState({
          fetch_error: true
        });
      })
  }

  handleSelectCharacter = (name, url) => {
    this.setState({
      selected: [name, url]
    });
  }

  handleCloseCharacter = () => {
    this.setState({
      selected: [null, null]
    })
  }

  render() {
    const name = this.state.selected[0];
    const url = this.state.selected[1];
    const current_page = this.state.current_page;

    const paginator = this.state.fetch_error ? <FetchError />: <Paginator loading={this.state.loading} people={this.state.people} characterSelected={name} current_page={current_page} onChangePage={this.handleChangePage} onSelectCharacter={this.handleSelectCharacter} />;

    return (
      <div>
        <Header />

        <div>
          {paginator}

          {url && 
            <Character url={url} onClose={this.handleCloseCharacter} />}
        </div>
      </div>
    );
  }
}

export default App;
