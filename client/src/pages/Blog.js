import React, { useState } from 'react';
import './Blog.css';

function Blog() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Subscribing email:', email);
    alert('Thank you for subscribing to SSAYE Blog!');
    setEmail('');
  };

  const blogPosts = [
    {
      id: 1,
      title: "SSAYE for Smart Living: Understanding Blockchain",
      category: "Technology",
      date: "August 15, 2024",
      excerpt: "So what is Blockchain, and what is the best way to describe it and how SSAYE is using it? If you recall the good old days, do you remember checking out a book at the library...",
      content: "If you recall the good old days, do you remember checking out a book at the library, and while you do that your name was put in the book on a card catalogue with a time stamp? The goal there was that if you damage the book somehow, everybody will know who did it. Blockchain is something similar to keep track of transactions in a secured way, except it's used for many other purposes including digital currency such as Bitcoins. Blockchain is essentially a database that keeps a log of all transactions that were ever verified on the network.",
      featured: true
    },
    {
      id: 2,
      title: "Goldman Sachs: The New Technology of Trust",
      category: "Finance",
      date: "July 28, 2024",
      excerpt: "A new technology is redefining the way we transact. If that sounds incredibly far-reaching, that's because it is...",
      content: "Blockchain has the potential to change the way we buy and sell, interact with government and verify the authenticity of everything from property titles to organic vegetables. It combines the openness of the internet with the security of cryptography to give everyone a faster, safer way to verify key information and establish trust.",
      featured: false
    },
    {
      id: 3,
      title: "Is Blockchain Disrupting Startup Funding?",
      category: "Startups",
      date: "July 20, 2024",
      excerpt: "Startups are now exploring blockchain's use in fintech and startup funding. This month alone, there were around 10 blockchain startups...",
      content: "Startups are now exploring blockchain's use in fintech and startup funding. This month alone, there were around 10 blockchain startups that launched their own cryptocurrency presales to fund their ventures. This represents a fundamental shift in how early-stage companies raise capital.",
      featured: false
    },
    {
      id: 4,
      title: "Legacy Thinking And Blockchain: Bridging The Gap",
      category: "Technology",
      date: "July 15, 2024",
      excerpt: "Blockchain has taken center stage in the fast-moving world of technological progress. The explosion of cryptocurrencies...",
      content: "Blockchain has taken center stage in the fast-moving world of technological progress. The explosion of cryptocurrencies, especially now that bitcoin's price has exceeded significant milestones, has ushered in an era of unprecedented hype. Startups and established enterprises alike are all rushing to establish their own blockchain presence.",
      featured: false
    },
    {
      id: 5,
      title: "Decentralizing The World Through Blockchain",
      category: "Business",
      date: "July 10, 2024",
      excerpt: "Traditional business models are built on centralization and the power of a single financial hub...",
      content: "Traditional business models are built on centralization and the power of a single financial hub. Centralized businesses are designed to create sales and user numbers. As users increase, profit margins increase, and the business grows around the hub. Blockchain technology is changing this paradigm.",
      featured: false
    },
    {
      id: 6,
      title: "NEO Co-Founder Banks On Blockchain For Smart Economy",
      category: "Smart Cities",
      date: "June 25, 2024",
      excerpt: "The financial world, ecommerce, and other industries that witness millions of transactions each day...",
      content: "The financial world, ecommerce, and other industries that witness millions of transactions each day, should prepare for fast-moving changes in order to stay ahead of competition and facilitate the rise of new solutions as well as accommodate the growing needs of businesses and consumers alike.",
      featured: false
    },
    {
      id: 7,
      title: "Goldman Sachs To Invest $1 Billion In India",
      category: "Investment",
      date: "June 18, 2024",
      excerpt: "Goldman Sachs is currently in the final stages of reviewing two platform deals—one in financial services...",
      content: "Goldman Sachs is currently in the final stages of reviewing two platform deals—one in financial services and the other in quasi-real estate. This significant investment demonstrates the growing confidence in emerging markets and blockchain technology.",
      featured: false
    },
    {
      id: 8,
      title: "How Blockchain Can Help End Poverty",
      category: "Social Impact",
      date: "June 5, 2024",
      excerpt: "Back in 2015, Forbes featured an interview with William Blair partner Brian Singer on how bitcoin will end world poverty...",
      content: "According to Singer, the growing access to the internet through affordable devices could enable particularly those from emerging markets to use a cheaper payment system with a transparent means of recording transactions. This could be transformative for poverty reduction.",
      featured: false
    }
  ];

  const categories = ["All", "Technology", "Finance", "Startups", "Business", "Smart Cities", "Investment", "Social Impact"];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPosts = selectedCategory === "All" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  return (
    <div className="blog-page">
      {/* Hero Section */}
      <section className="blog-hero-section">
        <div className="blog-hero-content">
          <h1 className="blog-hero-title">SSAYE Blog</h1>
          <p className="blog-hero-subtitle">Insights, News & Updates on Smart Living and Blockchain Technology</p>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-card">
            <div className="newsletter-content">
              <h2>Subscribe to Our Newsletter</h2>
              <p>Get the latest insights, updates, and news delivered to your inbox</p>
            </div>
            <form onSubmit={handleSubscribe} className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="newsletter-input"
              />
              <button type="submit" className="newsletter-btn">Subscribe</button>
            </form>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="category-filter-section">
        <div className="container">
          <div className="category-filters">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {selectedCategory === "All" && (
        <section className="featured-post-section">
          <div className="container">
            <h2 className="section-title">Featured Article</h2>
            {blogPosts.filter(post => post.featured).map((post) => (
              <div key={post.id} className="featured-post-card">
                <div className="featured-post-content">
                  <span className="post-category">{post.category}</span>
                  <h2>{post.title}</h2>
                  <p className="post-date">📅 {post.date}</p>
                  <p className="post-excerpt">{post.content}</p>
                  <button className="read-more-btn">Continue Reading →</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="blog-posts-section">
        <div className="container">
          <h2 className="section-title">
            {selectedCategory === "All" ? "Latest Articles" : `${selectedCategory} Articles`}
          </h2>
          <div className="blog-posts-grid">
            {filteredPosts.filter(post => !post.featured || selectedCategory !== "All").map((post) => (
              <div key={post.id} className="blog-post-card">
                <div className="post-header">
                  <span className="post-category-badge">{post.category}</span>
                </div>
                <h3 className="post-title">{post.title}</h3>
                <p className="post-date">📅 {post.date}</p>
                <p className="post-excerpt">{post.excerpt}</p>
                <button className="read-more-link">Read More →</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Smart Insights Section */}
      <section className="insights-section">
        <div className="container">
          <h2 className="section-title">Smart Insights</h2>
          <p className="section-description">Key takeaways and industry trends in blockchain and smart living</p>
          
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-number">01</div>
              <h3>Blockchain Disruption</h3>
              <p>Blockchain technology is fundamentally changing how startups raise funds, with cryptocurrency presales becoming a viable alternative to traditional venture capital.</p>
            </div>

            <div className="insight-card">
              <div className="insight-number">02</div>
              <h3>Smart Economy Growth</h3>
              <p>Financial institutions and industries are rapidly adapting to blockchain technology to stay competitive and meet growing consumer demands.</p>
            </div>

            <div className="insight-card">
              <div className="insight-number">03</div>
              <h3>Poverty Reduction</h3>
              <p>Emerging markets are leveraging blockchain and affordable internet access to create cheaper payment systems and transparent transaction recording.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="blog-cta-section">
        <div className="container">
          <h2>Stay Informed About Smart Living</h2>
          <p>Join our community and never miss an update on blockchain, smart cities, and sustainable living</p>
          <div className="cta-buttons">
            <button className="btn-primary">Join SSAYE Club</button>
            <button className="btn-secondary">Explore Our Services</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Blog;
