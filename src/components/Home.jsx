import Slider from './Slider';

export default function Home() {
  return (
    <>
      <Slider />

      
      <main>
        <br></br>
        <h2>Blackjack 101</h2>
        <p className='homeParagraph'>In Blackjack, the goal is to get a hand value as close to 21 as possible without exceeding 21, while also having a higher hand than the dealer's. Players aim to beat the dealer, not other players. Number cards are worth their face value, face cards are worth 10, and aces can be either 1 or 11. Players can <strong>hit</strong> to ask for another card, or <strong>stand</strong> to keep their current hand total. The dealer must hit on 16 or less and they must stand on 17 or more. </p>
        <br></br>
        <p className='homeParagraph'> In most casinos you also have the option to <strong>split</strong> if you are dealt a pair, to play two different hands. And you have an option to <strong>double down</strong>, or agree to double your initial bet in exchange for one more card. After you double down you can no longer hit. </p>
        <br></br>
        <h2>Learn Strategy</h2>
        <p className='homeParagraph'> 
        <strong>Basic blackjack strategy</strong> is a mathematically proven system for playing blackjack that minimizes the house edge by telling you the statistically best move for every possible hand: hit, stand, split, or double down. In <strong>single-deck blackjack</strong>, the rules slightly favor the player, so correct decisions matter even more.
        </p>
        <hr></hr>
        <br></br>
        <h2>Basic Strategy Rules</h2>
          <ol className="homelist">
            <li><strong>Always hit</strong> a hand of 8 or less.</li><br />
            <li><strong>Stand</strong> on a hard 17 or more.</li><br />
            <li><strong>Double down</strong> on 11 vs. any dealer card.</li><br />
            <li><strong>Split Aces and 8s</strong> — always.</li><br />
            <li><strong>Never split</strong> 5s or 10s.</li><br />
            <li><strong>Hit soft 17 (A+6)</strong> unless the dealer shows 3–6 — then double if allowed.</li><br />
            <h2> Basic strategy gives you the best move for any situation, reducing the house edge to under <strong>0.5%</strong> in single-deck games!
            </h2>
          </ol>
      </main>
    </>
  );
}
