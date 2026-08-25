// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SoundMint is ERC721, Ownable {

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

    mapping(uint256 => string)       public tokenURIs;
    mapping(uint256 => AudioTraits)  public tokenTraits;

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
}
