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
    const direction = props.next ? '>' : '<';

    return (
      <button className="button-paginator" onClick={() => props.onChangePage(props.url)}> 
        {direction} 
      </button>
    );  
}

class Paginator extends Component {
  constructor(props) {
    super(props);
  }

  handleSelectCharacter= (name, url) => {
    this.props.onSelectCharacter(name, url);
  }

  render() {
    const data = this.props.people;
    const character = this.props.characterSelected;
    const previous = data.previous ? <PaginatorButton url={data.previous} onChangePage={(url) => this.props.onChangePage(url)} /> : "";
    const next = data.next ? <PaginatorButton url={data.next} next={1} onChangePage={(url) => this.props.onChangePage(url)} /> : "";

    const content = this.props.loading ? <div className="loader"/> : <People people={data} selected={character} onSelectCharacter={this.handleSelectCharacter} />;

    return (
      <div className="paginator">
        {content}
        
        <div className="paginator-buttons">
          {previous}
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
    <button className="button" onClick={() => onClickHandler(url)}>{title}</button>
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
      <div>
        <FilmButton key={film} title={title} url={film} onClickHandler={onFilmClick} />
      </div>
    );
  });

  return (
    <div className="character-body">
      <div>
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
    if (prevState.character !== this.state.character) {
      fetch(this.props.url)
        .then(res => res.json())
        .then((data) => {
          this.setState({
            character: data,
            loading: false
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

    for (var i in films) {
      if (films[i].url === url) {
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
      fetch(url)
        .then(res => res.json())
        .then((data) => {
          const info = {"title": data.title, "description": data.opening_crawl, "director": data.director}
          films[url] = info;

          this.setState({
            films: films,
            active_film: url
          })
        })
    }
  }

  render() {
    const character = this.state.character;
    const active_film = this.state.active_film;
    const films = this.state.films;
    let body = null;

    if (active_film) {
      body = <div>
        <button className="button-back" onClick={this.handleCloseFilm}>Go back</button>
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
        fetch_error: null
    }
  }
  
  componentDidMount() {
    fetch('http://swapi.dev/api/people/')
      .then(res => res.json())
      .then((data) => {
        this.setState({ 
          people: data,
          loading: false
        })
      })
      .catch(function(error) {
        this.setState({
          fetch_error: true
        });
      })
  }

  handleChangePage = (url) => {
    this.setState({
      loading: true
    });

    fetch(url)
      .then(res => res.json())
      .then((data) => {
        this.setState({ 
          people: data,
          loading: false
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
    const paginator = this.state.fetch_error ? <FetchError />: <Paginator loading={this.state.loading} people={this.state.people} characterSelected={this.state.selected[0]} onChangePage={this.handleChangePage} onSelectCharacter={this.handleSelectCharacter} />;

    return (
      <div>
        <Header />

        <div>
          {paginator}

          {this.state.selected[1] && 
            <Character url={this.state.selected[1]} onClose={this.handleCloseCharacter} />}
        </div>
      </div>
    );
  }
}

export default App;
