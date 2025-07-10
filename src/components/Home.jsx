import Slider from './Slider';

export default function Home() {
  return (
    <>
      <Slider />

      
      <main>
        <br></br>
        <p className='homeParagraph'>In Blackjack, the goal is to get a hand value as close to 21 as possible without exceeding 21, while also having a higher hand than the dealer's. Players aim to beat the dealer, not other players. Number cards are worth their face value, face cards are worth 10, and aces can be 1 or 11. Players can 'hit' or 'stand'. The dealer must hit on 16 or less and they must stand on 17 or more.</p>
        <br></br>
        <hr></hr>
        <br></br>
        <ol className='homeList'>
          <li>
            1. If you are playing a game where you must bet, place your bet in the designated betting area prior to cards being dealt.
          </li>
          <br></br>
          <li>
            2. The dealer will deal you and every other player two cards. They will also deal themselves two cards, one face up and one face down.
          </li>
          <br></br>
          <li>
            3. Add up the value of the cards in your hand, and decide whether you want to hit or stand. Our game will give you recommendations as you play.
          </li>
          <br></br>
          <li>
            4. After all players have finished their hand, the dealer reveals their face-down card and follows the 'hit on 16, stand on 17' rule.
          </li>
          <br></br>
          <li>
            5. Determine the winner. If the player has the hand value closest to 21, they win! If the dealer has the hand closest to 21, the dealer wins. If the dealer and player tie, the player's bet is returned. If the player goes over 21, they 'bust' and lose their bet. If the dealer goes over 21, all players who did not bust win!
          </li>
        </ol>
      </main>
    </>
  );
}
