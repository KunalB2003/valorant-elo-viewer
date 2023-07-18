import Link from 'next/link'
import styles from'./Nav.module.css'



export default function Nav() {
    return <div className={styles["navbar"]}>
        <span><Link href="/"><h1>Valorant Elo Viewer</h1></Link></span>
        <span className={styles["gap"]}></span>
        <span><Link href="user/">View a player</Link></span>
        <span><Link href="visualize/">Visualize</Link></span>
    </div>
    
}