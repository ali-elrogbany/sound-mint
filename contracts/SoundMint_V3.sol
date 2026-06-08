// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SoundMint is ERC721, Ownable, ReentrancyGuard {

    // -------------------------------------------------------------------------
    // State
    // ------------------------// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SoundMint is ERC721, Ownable, ReentrancyGuard {

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    uint256 private _tokenIdCounter;

    struct AudioTraits {
        uint16 bpm;
        uint8  dominantKey;      // 0–11 (C=0 ... B=11)
        uint8  energyLevel;      // 0–255 normalized RMS
        uint8  brightness;       // 0–255 normalized spectral centroid
        string genre;
    }

    struct Listing {
        address seller;
        uint256 price;
        bool    active;
    }

    struct Offer {
        uint256 amount;
        bool    active;
    }

    mapping(uint256 => string)       public tokenURIs;
    mapping(uint256 => AudioTraits)  public tokenTraits;
    mapping(bytes32 => bool)         public mintedHashes;

    // Marketplace state
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => mapping(address => Offer)) public offers;
    mapping(uint256 => address[]) public offersByToken;

    // Gallery: track mint timestamp and minter per token
    mapping(uint256 => uint256) public mintedAt;     // tokenId => block.timestamp
    mapping(uint256 => address) public mintedBy;     // tokenId => original minter address

    uint256 public mintPrice = 0.01 ether;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event Minted(
        address indexed to,
        uint256 indexed tokenId,
        string  ipfsURI,
        uint256 timestamp
    );
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);

    // Marketplace Events
    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event Sold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event OfferMade(uint256 indexed tokenId, address indexed offerer, uint256 amount);
    event OfferCancelled(uint256 indexed tokenId, address indexed offerer);
    event OfferAccepted(uint256 indexed tokenId, address indexed seller, address indexed offerer, uint256 amount);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor() ERC721("SoundMint", "SNDM") Ownable(msg.sender) {}

    // -------------------------------------------------------------------------
    // Core mint
    // -------------------------------------------------------------------------

    /**
     * @notice Mint a new SoundMint NFT.
     * @param to        Recipient wallet address.
     * @param ipfsURI   IPFS metadata URI (ipfs://CID).
     * @param traits    On-chain audio traits derived from the uploaded track.
     * @return tokenId  The newly minted token ID.
     */
    function mint(
        address to,
        string calldata ipfsURI,
        AudioTraits calldata traits,
        bytes32 audioHash
    ) external payable returns (uint256) {
        require(msg.value >= mintPrice, "Insufficient ETH");
        require(!mintedHashes[audioHash], "Song already minted");

        uint256 tokenId = ++_tokenIdCounter;
        _safeMint(to, tokenId);

        tokenURIs[tokenId]   = ipfsURI;
        tokenTraits[tokenId] = traits;
        mintedHashes[audioHash] = true;
        mintedAt[tokenId]    = block.timestamp;
        mintedBy[tokenId]    = msg.sender;

        emit Minted(to, tokenId, ipfsURI, block.timestamp);
        return tokenId;
    }

    // -------------------------------------------------------------------------
    // View helpers — used directly by the Gallery frontend / backend
    // -------------------------------------------------------------------------

    /**
     * @notice Returns the IPFS metadata URI for a given token.
     *         Overrides ERC721's default (which reads from _baseURI).
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenURIs[tokenId];
    }

    /**
     * @notice Returns the full AudioTraits struct for a given token.
     *         Called by the Gallery to populate trait badges on the token
     *         detail page without requiring an IPFS round-trip.
     */
    function getTraits(uint256 tokenId)
        external
        view
        returns (AudioTraits memory)
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenTraits[tokenId];
    }

    /**
     * @notice Returns the total number of tokens minted so far.
     *         Used by the Gallery backend to paginate the collection
     *         (iterate tokenId 1..totalSupply) and by the frontend
     *         to display the collection size.
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @notice Convenience bundle for the Gallery token detail page.
     *         Returns everything the page needs in a single RPC call,
     *         avoiding three separate eth_call round-trips.
     * @return uri        IPFS metadata URI.
     * @return traits     On-chain audio traits.
     * @return owner      Current token owner.
     * @return minter     Original minter address.
     * @return timestamp  Block timestamp of the mint.
     */
    function getTokenDetail(uint256 tokenId)
        external
        view
        returns (
            string  memory uri,
            AudioTraits memory traits,
            address owner,
            address minter,
            uint256 timestamp
        )
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return (
            tokenURIs[tokenId],
            tokenTraits[tokenId],
            ownerOf(tokenId),
            mintedBy[tokenId],
            mintedAt[tokenId]
        );
    }

    // -------------------------------------------------------------------------
    // Admin
    // -------------------------------------------------------------------------

    /**
     * @notice Update the mint price. Emits MintPriceUpdated.
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        emit MintPriceUpdated(mintPrice, newPrice);
        mintPrice = newPrice;
    }

    /**
     * @notice Withdraw contract balance to owner.
     *         Uses call() per SEC-SC-002 to avoid gas griefing with transfer().
     */
    function withdraw() external onlyOwner {
        (bool ok, ) = payable(owner()).call{value: address(this).balance}("");
        require(ok, "Withdraw failed");
    }

    // -------------------------------------------------------------------------
    // Marketplace
    // -------------------------------------------------------------------------

    /**
     * @notice List a token for sale. Transfers token to this contract (escrow).
     */
    function listToken(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(price > 0, "Price must be > 0");

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });

        // Escrow the token
        transferFrom(msg.sender, address(this), tokenId);

        emit Listed(tokenId, msg.sender, price);
    }

    /**
     * @notice Cancel a listing and return the token to the seller.
     */
    function cancelListing(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(listing.seller == msg.sender, "Not seller");

        delete listings[tokenId];

        // Return token to seller
        _transfer(address(this), msg.sender, tokenId);

        emit ListingCancelled(tokenId, msg.sender);
    }

    /**
     * @notice Buy a listed token.
     */
    function buyToken(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(msg.value >= listing.price, "Insufficient ETH");

        address seller = listing.seller;
        uint256 price = listing.price;

        delete listings[tokenId];

        // Transfer token to buyer
        _transfer(address(this), msg.sender, tokenId);

        // Transfer funds to seller (0% fee per requirements)
        (bool ok, ) = payable(seller).call{value: price}("");
        require(ok, "Transfer to seller failed");

        // Refund excess
        if (msg.value > price) {
            (bool refundOk, ) = payable(msg.sender).call{value: msg.value - price}("");
            require(refundOk, "Refund failed");
        }

        emit Sold(tokenId, seller, msg.sender, price);
    }

    /**
     * @notice Deposit ETH to make an offer on a token.
     */
    function makeOffer(uint256 tokenId) external payable {
        require(_ownerOf(tokenId) != address(0) || listings[tokenId].active, "Token does not exist");
        require(msg.value > 0, "Offer must be > 0");
        
        address currentOwner = listings[tokenId].active ? listings[tokenId].seller : ownerOf(tokenId);
        require(msg.sender != currentOwner, "Owner cannot offer");

        Offer storage existingOffer = offers[tokenId][msg.sender];
        if (!existingOffer.active) {
            offersByToken[tokenId].push(msg.sender);
        }

        uint256 newAmount = existingOffer.amount + msg.value;
        offers[tokenId][msg.sender] = Offer({
            amount: newAmount,
            active: true
        });

        emit OfferMade(tokenId, msg.sender, newAmount);
    }

    /**
     * @notice Cancel an active offer and withdraw the deposited ETH.
     */
    function cancelOffer(uint256 tokenId) external nonReentrant {
        Offer memory offer = offers[tokenId][msg.sender];
        require(offer.active, "No active offer");

        uint256 amount = offer.amount;
        delete offers[tokenId][msg.sender];

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Refund failed");

        emit OfferCancelled(tokenId, msg.sender);
    }

    /**
     * @notice Accept an offer. Caller must be the current owner or the seller if listed.
     */
    function acceptOffer(uint256 tokenId, address offerer) external nonReentrant {
        Offer memory offer = offers[tokenId][offerer];
        require(offer.active, "No active offer");

        address currentOwner;
        if (listings[tokenId].active) {
            require(listings[tokenId].seller == msg.sender, "Not seller");
            currentOwner = address(this); // Token is in escrow
            delete listings[tokenId]; // Cancel listing
        } else {
            require(ownerOf(tokenId) == msg.sender, "Not owner");
            currentOwner = msg.sender;
        }

        uint256 amount = offer.amount;
        delete offers[tokenId][offerer];

        // Transfer token to offerer
        _transfer(currentOwner, offerer, tokenId);

        // Transfer funds to seller (0% fee)
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");

        emit OfferAccepted(tokenId, msg.sender, offerer, amount);
    }

    /**
     * @notice Get all active listings for a token.
     */
    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }

    /**
     * @notice Get a specific offer.
     */
    function getOffer(uint256 tokenId, address offerer) external view returns (Offer memory) {
        return offers[tokenId][offerer];
    }

    /**
     * @notice Get all addresses that have made an offer on a token.
     */
    function getOfferers(uint256 tokenId) external view returns (address[] memory) {
        return offersByToken[tokenId];
    }
}
-------------------------------------------------

    uint256 private _tokenIdCounter;

    struct AudioTraits {
        uint16 bpm;
        uint8  dominantKey;      // 0–11 (C=0 ... B=11)
        uint8  energyLevel;      // 0–255 normalized RMS
        uint8  brightness;       // 0–255 normalized spectral centroid
        string genre;
    }

    struct Listing {
        address seller;
        uint256 price;
        bool    active;
    }

    struct Offer {
        uint256 amount;
        bool    active;
    }

    mapping(uint256 => string)       public tokenURIs;
    mapping(uint256 => AudioTraits)  public tokenTraits;

    // Marketplace state
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => mapping(address => Offer)) public offers;
    mapping(uint256 => address[]) public offersByToken;

    // Gallery: track mint timestamp and minter per token
    mapping(uint256 => uint256) public mintedAt;     // tokenId => block.timestamp
    mapping(uint256 => address) public mintedBy;     // tokenId => original minter address

    uint256 public mintPrice = 0.01 ether;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event Minted(
        address indexed to,
        uint256 indexed tokenId,
        string  ipfsURI,
        uint256 timestamp
    );
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);

    // Marketplace Events
    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event Sold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event OfferMade(uint256 indexed tokenId, address indexed offerer, uint256 amount);
    event OfferCancelled(uint256 indexed tokenId, address indexed offerer);
    event OfferAccepted(uint256 indexed tokenId, address indexed seller, address indexed offerer, uint256 amount);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor() ERC721("SoundMint", "SNDM") Ownable(msg.sender) {}

    // -------------------------------------------------------------------------
    // Core mint
    // -------------------------------------------------------------------------

    /**
     * @notice Mint a new SoundMint NFT.
     * @param to        Recipient wallet address.
     * @param ipfsURI   IPFS metadata URI (ipfs://CID).
     * @param traits    On-chain audio traits derived from the uploaded track.
     * @return tokenId  The newly minted token ID.
     */
    function mint(
        address to,
        string calldata ipfsURI,
        AudioTraits calldata traits
    ) external payable returns (uint256) {
        require(msg.value >= mintPrice, "Insufficient ETH");

        uint256 tokenId = ++_tokenIdCounter;
        _safeMint(to, tokenId);

        tokenURIs[tokenId]   = ipfsURI;
        tokenTraits[tokenId] = traits;
        mintedAt[tokenId]    = block.timestamp;
        mintedBy[tokenId]    = msg.sender;

        emit Minted(to, tokenId, ipfsURI, block.timestamp);
        return tokenId;
    }

    // -------------------------------------------------------------------------
    // View helpers — used directly by the Gallery frontend / backend
    // -------------------------------------------------------------------------

    /**
     * @notice Returns the IPFS metadata URI for a given token.
     *         Overrides ERC721's default (which reads from _baseURI).
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenURIs[tokenId];
    }

    /**
     * @notice Returns the full AudioTraits struct for a given token.
     *         Called by the Gallery to populate trait badges on the token
     *         detail page without requiring an IPFS round-trip.
     */
    function getTraits(uint256 tokenId)
        external
        view
        returns (AudioTraits memory)
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenTraits[tokenId];
    }

    /**
     * @notice Returns the total number of tokens minted so far.
     *         Used by the Gallery backend to paginate the collection
     *         (iterate tokenId 1..totalSupply) and by the frontend
     *         to display the collection size.
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @notice Convenience bundle for the Gallery token detail page.
     *         Returns everything the page needs in a single RPC call,
     *         avoiding three separate eth_call round-trips.
     * @return uri        IPFS metadata URI.
     * @return traits     On-chain audio traits.
     * @return owner      Current token owner.
     * @return minter     Original minter address.
     * @return timestamp  Block timestamp of the mint.
     */
    function getTokenDetail(uint256 tokenId)
        external
        view
        returns (
            string  memory uri,
            AudioTraits memory traits,
            address owner,
            address minter,
            uint256 timestamp
        )
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return (
            tokenURIs[tokenId],
            tokenTraits[tokenId],
            ownerOf(tokenId),
            mintedBy[tokenId],
            mintedAt[tokenId]
        );
    }

    // -------------------------------------------------------------------------
    // Admin
    // -------------------------------------------------------------------------

    /**
     * @notice Update the mint price. Emits MintPriceUpdated.
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        emit MintPriceUpdated(mintPrice, newPrice);
        mintPrice = newPrice;
    }

    /**
     * @notice Withdraw contract balance to owner.
     *         Uses call() per SEC-SC-002 to avoid gas griefing with transfer().
     */
    function withdraw() external onlyOwner {
        (bool ok, ) = payable(owner()).call{value: address(this).balance}("");
        require(ok, "Withdraw failed");
    }

    // -------------------------------------------------------------------------
    // Marketplace
    // -------------------------------------------------------------------------

    /**
     * @notice List a token for sale. Transfers token to this contract (escrow).
     */
    function listToken(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(price > 0, "Price must be > 0");

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });

        // Escrow the token
        transferFrom(msg.sender, address(this), tokenId);

        emit Listed(tokenId, msg.sender, price);
    }

    /**
     * @notice Cancel a listing and return the token to the seller.
     */
    function cancelListing(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(listing.seller == msg.sender, "Not seller");

        delete listings[tokenId];

        // Return token to seller
        _transfer(address(this), msg.sender, tokenId);

        emit ListingCancelled(tokenId, msg.sender);
    }

    /**
     * @notice Buy a listed token.
     */
    function buyToken(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(msg.value >= listing.price, "Insufficient ETH");

        address seller = listing.seller;
        uint256 price = listing.price;

        delete listings[tokenId];

        // Transfer token to buyer
        _transfer(address(this), msg.sender, tokenId);

        // Transfer funds to seller (0% fee per requirements)
        (bool ok, ) = payable(seller).call{value: price}("");
        require(ok, "Transfer to seller failed");

        // Refund excess
        if (msg.value > price) {
            (bool refundOk, ) = payable(msg.sender).call{value: msg.value - price}("");
            require(refundOk, "Refund failed");
        }

        emit Sold(tokenId, seller, msg.sender, price);
    }

    /**
     * @notice Deposit ETH to make an offer on a token.
     */
    function makeOffer(uint256 tokenId) external payable {
        require(_ownerOf(tokenId) != address(0) || listings[tokenId].active, "Token does not exist");
        require(msg.value > 0, "Offer must be > 0");
        
        address currentOwner = listings[tokenId].active ? listings[tokenId].seller : ownerOf(tokenId);
        require(msg.sender != currentOwner, "Owner cannot offer");

        Offer storage existingOffer = offers[tokenId][msg.sender];
        if (!existingOffer.active) {
            offersByToken[tokenId].push(msg.sender);
        }

        uint256 newAmount = existingOffer.amount + msg.value;
        offers[tokenId][msg.sender] = Offer({
            amount: newAmount,
            active: true
        });

        emit OfferMade(tokenId, msg.sender, newAmount);
    }

    /**
     * @notice Cancel an active offer and withdraw the deposited ETH.
     */
    function cancelOffer(uint256 tokenId) external nonReentrant {
        Offer memory offer = offers[tokenId][msg.sender];
        require(offer.active, "No active offer");

        uint256 amount = offer.amount;
        delete offers[tokenId][msg.sender];

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Refund failed");

        emit OfferCancelled(tokenId, msg.sender);
    }

    /**
     * @notice Accept an offer. Caller must be the current owner or the seller if listed.
     */
    function acceptOffer(uint256 tokenId, address offerer) external nonReentrant {
        Offer memory offer = offers[tokenId][offerer];
        require(offer.active, "No active offer");

        address currentOwner;
        if (listings[tokenId].active) {
            require(listings[tokenId].seller == msg.sender, "Not seller");
            currentOwner = address(this); // Token is in escrow
            delete listings[tokenId]; // Cancel listing
        } else {
            require(ownerOf(tokenId) == msg.sender, "Not owner");
            currentOwner = msg.sender;
        }

        uint256 amount = offer.amount;
        delete offers[tokenId][offerer];

        // Transfer token to offerer
        _transfer(currentOwner, offerer, tokenId);

        // Transfer funds to seller (0% fee)
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");

        emit OfferAccepted(tokenId, msg.sender, offerer, amount);
    }

    /**
     * @notice Get all active listings for a token.
     */
    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }

    /**
     * @notice Get a specific offer.
     */
    function getOffer(uint256 tokenId, address offerer) external view returns (Offer memory) {
        return offers[tokenId][offerer];
    }

    /**
     * @notice Get all addresses that have made an offer on a token.
     */
    function getOfferers(uint256 tokenId) external view returns (address[] memory) {
        return offersByToken[tokenId];
    }
}
